import React, { useState } from 'react';
import {
  ImageFileItem,
  OutputFormat,
  PresetOption,
  ResizeSettings,
  SNS_PRESETS,
  SharpenLevel,
  UpscaleTargetMode,
} from '../types/index';
import { calculateUpscalePlan } from '../utils/imageResizer';

interface ResizeOptionsPanelProps {
  settings: ResizeSettings;
  sampleItem?: ImageFileItem;
  onChange: (updated: Partial<ResizeSettings>) => void;
  itemCount: number;
  isProcessing: boolean;
  onBackToStep1: () => void;
  onStartProcess: () => void;
}

const FORMAT_CARDS: {
  value: OutputFormat;
  label: string;
  badge: string;
  desc: string;
  icon: string;
}[] = [
  {
    value: 'original',
    label: '원본 형식 그대로',
    badge: '확장자 유지',
    desc: '올린 사진의 원래 확장자(JPG/PNG) 그대로 저장',
    icon: 'fas fa-file-image',
  },
  {
    value: 'image/jpeg',
    label: 'JPG (JPEG) 변환',
    badge: '호환성 최고',
    desc: '블로그·쇼핑몰·문서 어디서나 열리는 표준 사진 파일',
    icon: 'fas fa-camera',
  },
  {
    value: 'image/png',
    label: 'PNG 고화질 변환',
    badge: '투명 배경 보존',
    desc: '로고·아이콘·글자가 들어간 캡처 이미지에 최적',
    icon: 'fas fa-layer-group',
  },
  {
    value: 'image/webp',
    label: 'WebP 압축 변환',
    badge: '용량 80% 절감',
    desc: '화질은 선명하게 유지하면서 용량만 확 줄이는 웹 표준',
    icon: 'fas fa-bolt',
  },
];

const UPSCALE_TARGETS: readonly {
  readonly key: UpscaleTargetMode;
  readonly label: string;
  readonly sub: string;
}[] = [
  { key: '2x', label: '2× 확대', sub: '면적 4배' },
  { key: '3x', label: '3× 확대', sub: '면적 9배' },
  { key: '4x', label: '4× 확대', sub: '면적 16배' },
  { key: '6x', label: '6× 확대', sub: 'AI 3×→2× · 36배' },
  { key: '8x', label: '8× 확대', sub: 'AI 4×→2× · 64배' },
  { key: 'fhd', label: 'FHD 맞춤', sub: '긴 변 1920px' },
  { key: '4k', label: '4K 맞춤', sub: '긴 변 3840px' },
  { key: '8k', label: '8K 맞춤', sub: '긴 변 7680px' },
];

type ResizeSubMode = 'keep_original' | 'percent' | 'pixel' | 'target_kb';

const SHARPEN_OPTIONS: readonly {
  readonly key: SharpenLevel;
  readonly label: string;
}[] = [
  { key: 'none', label: '보정 안 함' },
  { key: 'natural', label: '자연스럽게 (권장)' },
  { key: 'crisp', label: '또렷하게 강조' },
];

export default function ResizeOptionsPanel({
  settings,
  sampleItem,
  onChange,
  itemCount,
  isProcessing,
  onBackToStep1,
  onStartProcess,
}: ResizeOptionsPanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [lastResizeSubMode, setLastResizeSubMode] = useState<ResizeSubMode>(() => {
    if (settings.unit === 'pixel') return 'pixel';
    if (settings.unit === 'target_kb') return 'target_kb';
    if (settings.unit === 'percent' && settings.percent !== 100) return 'percent';
    return 'keep_original';
  });

  // '원본 크기 그대로(100%)' 상태 판별
  const isKeepOriginalSize = settings.unit === 'percent' && settings.percent === 100;
  const isPercentScale = settings.unit === 'percent' && settings.percent !== 100;
  const isUpscaleMode = settings.unit === 'upscale';

  const currentResizeLabel = isUpscaleMode
    ? '고화질 업스케일링'
    : isKeepOriginalSize
      ? '포맷만 변환'
      : isPercentScale
        ? '비율로 축소 (%)'
        : settings.unit === 'pixel'
          ? '픽셀 · SNS 규격'
          : '목표 용량 맞춤';

  const previewPlan = sampleItem
    ? calculateUpscalePlan(sampleItem.originalWidth, sampleItem.originalHeight, settings)
    : null;

  const handleSelectKeepOriginalSize = () => {
    setLastResizeSubMode('keep_original');
    onChange({ unit: 'percent', percent: 100 });
  };

  const handleSelectPercentScale = () => {
    setLastResizeSubMode('percent');
    onChange({ unit: 'percent', percent: settings.percent === 100 ? 75 : settings.percent });
  };

  const handleSelectPixelMode = () => {
    setLastResizeSubMode('pixel');
    onChange({ unit: 'pixel' });
  };

  const handleSelectTargetKbMode = () => {
    setLastResizeSubMode('target_kb');
    onChange({ unit: 'target_kb' });
  };

  const handleSelectResizeTab = () => {
    if (!isUpscaleMode) return;
    switch (lastResizeSubMode) {
      case 'percent':
        handleSelectPercentScale();
        break;
      case 'pixel':
        handleSelectPixelMode();
        break;
      case 'target_kb':
        handleSelectTargetKbMode();
        break;
      case 'keep_original':
      default:
        handleSelectKeepOriginalSize();
        break;
    }
  };

  const handlePresetSelect = (preset: PresetOption) => {
    setSelectedPresetId(preset.id);
    onChange({
      unit: 'pixel',
      width: preset.width,
      height: preset.height,
      fitMode: preset.fitMode,
    });
  };

  const handleCustomPresetDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPresetId(val);
    if (val === 'custom') return;
    const found = SNS_PRESETS.find((p) => p.id === val);
    if (found) {
      handlePresetSelect(found);
    }
  };

  const handleWidthChange = (val: number) => {
    setSelectedPresetId('custom');
    if (settings.lockAspectRatio && settings.width > 0) {
      const ratio = settings.height / settings.width;
      onChange({ width: val, height: Math.max(1, Math.round(val * ratio)) });
    } else {
      onChange({ width: val });
    }
  };

  const handleHeightChange = (val: number) => {
    setSelectedPresetId('custom');
    if (settings.lockAspectRatio && settings.height > 0) {
      const ratio = settings.width / settings.height;
      onChange({ height: val, width: Math.max(1, Math.round(val * ratio)) });
    } else {
      onChange({ height: val });
    }
  };

  return (
    <div
      data-screenshot-point="action"
      className="w-full bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] border-t-4 border-t-indigo-600 shadow-md space-y-6 animate-fade-in"
    >
      {/* 상단 스텝 헤더 */}
      <div className="flex items-start justify-between gap-3 border-b border-[#EBE6DD] pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-black mb-1.5 shadow-2xs">
            STEP 2 · 옵션 선택 (총 {itemCount}장 준비됨)
          </span>
          <h2 className="text-lg sm:text-xl font-black text-[#2D2A26]">
            저장할 파일 형식과 크기를 선택해 주세요
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            아래에서 <strong>1. 파일 형식</strong>과 <strong>2. 이미지 크기</strong>를 고른 뒤 하단의 <strong>[변환 시작하기]</strong> 버튼을 누르세요.
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. 파일 형식(확장자) 선택 — 숨김 없이 가장 먼저 한눈에 보이도록 배치 */}
      {/* ===================================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-black text-[#2D2A26] flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
              1
            </span>
            <span>저장할 파일 형식(확장자) 선택</span>
          </label>
          <span className="text-[11px] font-bold text-indigo-600">
            현재: {FORMAT_CARDS.find((f) => f.value === settings.format)?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FORMAT_CARDS.map((fmt) => {
            const active = settings.format === fmt.value;
            return (
              <button
                key={fmt.value}
                type="button"
                onClick={() => onChange({ format: fmt.value })}
                className={`relative p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                  active
                    ? 'bg-indigo-50/90 text-indigo-950 border-2 border-indigo-600 shadow-xs'
                    : 'bg-[#FAF8F5] text-[#2D2A26] border border-[#EBE6DD] hover:bg-stone-100'
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center">
                    <i className="fas fa-check"></i>
                  </span>
                )}
                <div>
                  <span
                    className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md mb-1.5 ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-stone-600 border border-[#EBE6DD]'
                    }`}
                  >
                    {fmt.badge}
                  </span>
                  <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                    <i className={`${fmt.icon} text-xs ${active ? 'text-indigo-600' : 'text-stone-500'}`}></i>
                    <span>{fmt.label}</span>
                  </div>
                </div>
                <p
                  className={`text-[10px] mt-1.5 leading-snug line-clamp-2 ${
                    active ? 'text-indigo-800 font-semibold' : 'text-stone-500'
                  }`}
                >
                  {fmt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. 업스케일링 · 해상도 조절 방식 선택 (2단 탭 분리) */}
      {/* ===================================================================== */}
      <div className="pt-4 border-t border-[#EBE6DD] space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-xs sm:text-sm font-black text-[#2D2A26] flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
              2
            </span>
            <span>업스케일링 · 해상도 조절 방식 선택</span>
          </label>
          <span className="text-[11px] font-bold text-indigo-600">
            현재: {currentResizeLabel}
          </span>
        </div>

        {/* 상단 2단 세그먼트 탭 바 */}
        <div
          role="tablist"
          aria-label="해상도 및 크기 처리 방식"
          className="bg-[#F3EFE8] p-1 rounded-2xl border border-[#E5DDD0] grid grid-cols-2 gap-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isUpscaleMode}
            onClick={() => onChange({ unit: 'upscale' })}
            className={`px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              isUpscaleMode
                ? 'bg-white text-indigo-950 border-2 border-indigo-600 shadow-xs'
                : 'bg-transparent text-stone-600 border-2 border-transparent hover:bg-white/60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                isUpscaleMode
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-stone-500 border border-[#E5DDD0]'
              }`}
            >
              <i className="fas fa-wand-magic-sparkles"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black truncate">고화질 업스케일링</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-indigo-600 text-white shrink-0">
                  CSR 추천
                </span>
              </div>
              <p className="text-[10px] text-stone-500 truncate mt-0.5">
                2×~8× · FHD · 4K · 8K 실해상도 확대
              </p>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!isUpscaleMode}
            onClick={handleSelectResizeTab}
            className={`px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              !isUpscaleMode
                ? 'bg-white text-indigo-950 border-2 border-indigo-600 shadow-xs'
                : 'bg-transparent text-stone-600 border-2 border-transparent hover:bg-white/60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                !isUpscaleMode
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-stone-500 border border-[#E5DDD0]'
              }`}
            >
              <i className="fas fa-sliders"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black truncate">
                  크기 · 용량 · 포맷 조절
                </span>
              </div>
              <p className="text-[10px] text-stone-500 truncate mt-0.5">
                원본 유지 · 축소 · SNS · KB 맞춤
              </p>
            </div>
          </button>
        </div>

        {/* 선택된 탭에 따른 단일 통합 설정 패널 */}
        <div
          role="tabpanel"
          aria-label={isUpscaleMode ? '고화질 업스케일링 설정' : '크기 · 용량 · 포맷 조절 설정'}
          className="bg-indigo-50/40 rounded-2xl p-4 sm:p-5 border border-indigo-100 space-y-4"
        >
          {!isUpscaleMode && (
            <div className="space-y-2 pb-3 border-b border-indigo-100">
              <span className="block text-xs font-black text-indigo-950">
                크기 · 용량 변환 방식 선택
              </span>
              <div
                role="radiogroup"
                aria-label="크기 및 용량 조절 세부 방식"
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={isKeepOriginalSize}
                  onClick={handleSelectKeepOriginalSize}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isKeepOriginalSize
                      ? 'bg-white text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                      : 'bg-white/70 text-stone-600 border border-indigo-100 hover:bg-white'
                  }`}
                >
                  <i
                    className={`fas fa-expand text-sm ${
                      isKeepOriginalSize ? 'text-indigo-600' : 'text-stone-400'
                    }`}
                  ></i>
                  <span>포맷만 변환</span>
                  <span className="text-[10px] font-normal text-stone-500">원본 크기 유지</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={isPercentScale}
                  onClick={handleSelectPercentScale}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isPercentScale
                      ? 'bg-white text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                      : 'bg-white/70 text-stone-600 border border-indigo-100 hover:bg-white'
                  }`}
                >
                  <i
                    className={`fas fa-percent text-sm ${
                      isPercentScale ? 'text-indigo-600' : 'text-stone-400'
                    }`}
                  ></i>
                  <span>비율로 축소 (%)</span>
                  <span className="text-[10px] font-normal text-stone-500">25% · 50% · 75%</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.unit === 'pixel'}
                  onClick={handleSelectPixelMode}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    settings.unit === 'pixel'
                      ? 'bg-white text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                      : 'bg-white/70 text-stone-600 border border-indigo-100 hover:bg-white'
                  }`}
                >
                  <i
                    className={`fas fa-th-large text-sm ${
                      settings.unit === 'pixel' ? 'text-indigo-600' : 'text-stone-400'
                    }`}
                  ></i>
                  <span>픽셀 · SNS 규격</span>
                  <span className="text-[10px] font-normal text-stone-500">
                    블로그·유튜브·직접입력
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.unit === 'target_kb'}
                  onClick={handleSelectTargetKbMode}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    settings.unit === 'target_kb'
                      ? 'bg-white text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                      : 'bg-white/70 text-stone-600 border border-indigo-100 hover:bg-white'
                  }`}
                >
                  <i
                    className={`fas fa-weight-hanging text-sm ${
                      settings.unit === 'target_kb' ? 'text-indigo-600' : 'text-stone-400'
                    }`}
                  ></i>
                  <span>목표 용량 맞춤</span>
                  <span className="text-[10px] font-normal text-stone-500">
                    300KB · 500KB 이하
                  </span>
                </button>
              </div>
            </div>
          )}

          {isUpscaleMode && (
            <div className="space-y-4">
              {/* CSR 엔진 선택 */}
              <div className="space-y-2">
                <span className="block text-xs font-black text-indigo-950">
                  CSR 업스케일 엔진 선택 (100% 브라우저 로컬)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onChange({ upscaleEngine: 'ai-esrgan' })}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                      settings.upscaleEngine === 'ai-esrgan'
                        ? 'bg-white border-2 border-indigo-600 shadow-xs'
                        : 'bg-white/75 border-indigo-100 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
                        <i className="fas fa-microchip text-indigo-600"></i>
                        AI 초해상도 (ESRGAN)
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        최대 8× · 16K
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug">
                      원본 축소 없이 타일별 딥러닝 복원 (6×·8×는 2단 연쇄 추론 · WebGL GPU 가속)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange({ upscaleEngine: 'lanczos3' })}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                      settings.upscaleEngine === 'lanczos3'
                        ? 'bg-white border-2 border-indigo-600 shadow-xs'
                        : 'bg-white/75 border-indigo-100 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
                        <i className="fas fa-bolt text-emerald-600"></i>
                        초고속 정밀 보간 (Lanczos-3)
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        초고속 · 최대 16K
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug">
                      모델 다운로드 0MB · 스트립 스트리밍 정밀 보간 (초고배율 대량 배치 추천)
                    </p>
                  </button>
                </div>
              </div>

              {/* 목표 확대 배율 · 해상도 */}
              <div className="space-y-2">
                <span className="block text-xs font-black text-indigo-950">
                  목표 배율 · 해상도 선택
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {UPSCALE_TARGETS.map((target) => {
                    const active = settings.upscaleTarget === target.key;
                    return (
                      <button
                        key={target.key}
                        type="button"
                        onClick={() => onChange({ upscaleTarget: target.key })}
                        className={`py-2 px-2 rounded-xl text-center border cursor-pointer transition-all ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-[#2D2A26] border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="text-xs font-black">{target.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            active ? 'text-indigo-100' : 'text-stone-500'
                          }`}
                        >
                          {target.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 선명도 보정 + 예상 결과 해상도 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-indigo-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black text-indigo-950 mr-1">
                    엣지 선명화:
                  </span>
                  {SHARPEN_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => onChange({ sharpenLevel: opt.key })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                        settings.sharpenLevel === opt.key
                          ? 'bg-[#2D2A26] text-white border-[#2D2A26]'
                          : 'bg-white text-stone-600 border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {sampleItem && previewPlan && (
                  <div className="text-[11px] font-mono font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1.5 flex-wrap shrink-0">
                    <span className="text-stone-500">예상:</span>
                    <span>
                      {sampleItem.originalWidth}×{sampleItem.originalHeight} ➔ {previewPlan.targetW}×
                      {previewPlan.targetH}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px]">
                      {previewPlan.effectiveScale.toFixed(1)}× · 픽셀{' '}
                      {Math.max(1, Math.round(previewPlan.pixelMultiplier))}배
                    </span>
                    {previewPlan.wasCappedForMemory && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                        기기 한계 보정
                      </span>
                    )}
                  </div>
                )}
              </div>

              {sampleItem && previewPlan && (
                <div className="space-y-1.5">
                  {previewPlan.alreadyExceedsTarget && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] font-bold text-amber-900 flex items-center gap-2">
                      <i className="fas fa-circle-info text-amber-600 shrink-0"></i>
                      <span>
                        원본이 이미 목표 해상도 이상입니다. 확대하려면 상단에서 2×~8× 배율을 선택하세요.
                      </span>
                    </div>
                  )}

                  {previewPlan.wasCappedForMemory && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] font-bold text-amber-900 flex items-center gap-2">
                      <i className="fas fa-triangle-exclamation text-amber-600 shrink-0"></i>
                      <span>
                        {previewPlan.deviceLabel} 최대 캔버스 한계(긴 변{' '}
                        {previewPlan.maxLongEdge.toLocaleString()}px)에 맞춰 자동 보정됩니다.
                      </span>
                    </div>
                  )}

                  {previewPlan.isTwoStageAi && (
                    <div className="rounded-xl bg-white/80 border border-indigo-200 px-3 py-2 text-[11px] font-bold text-indigo-900 flex items-center gap-2">
                      <i className="fas fa-microchip text-indigo-600 shrink-0"></i>
                      <span>
                        6×·8× AI 2단 연쇄 추론(3×→2× / 4×→2×)은 고해상도일수록 수십 초~수 분이 소요될 수 있으며, 실행 중 언제든 중단할 수 있습니다.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isKeepOriginalSize && (
            <div className="flex items-center gap-3 text-xs sm:text-sm text-indigo-950 font-bold">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <i className="fas fa-check"></i>
              </div>
              <div>
                <p className="font-black">가로 × 세로 해상도는 원본 그대로(100%) 유지합니다.</p>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  위에서 선택한 <strong>파일 형식({FORMAT_CARDS.find((f) => f.value === settings.format)?.label})</strong>과 화질 설정만 적용하여 변환합니다.
                </p>
              </div>
            </div>
          )}

          {settings.unit === 'percent' && !isKeepOriginalSize && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950">원본 대비 축소 비율 선택</span>
                <span className="font-mono font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 text-xs">
                  원본의 {settings.percent}% 크기
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 90].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onChange({ percent: pct })}
                    className={`py-2.5 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      settings.percent === pct
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-stone-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {pct}% {pct === 50 ? '(절반)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {settings.unit === 'pixel' && (
            <div className="space-y-4">
              {/* 빠른 SNS 규격 선택 칩 */}
              <div>
                <label className="block text-xs font-black text-indigo-950 mb-2">
                  자주 쓰는 SNS · 블로그 규격 원클릭 선택
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    { id: 'naver_thumb', label: '🟢 네이버 썸네일 (800×800)' },
                    { id: 'naver_body', label: '🟢 블로그 본문 (860×573)' },
                    { id: 'yt_thumb', label: '🔴 유튜브 썸네일 (1280×720)' },
                    { id: 'insta_square', label: '🟣 인스타 정사각 (1080×1080)' },
                    { id: 'gen_fhd', label: '💻 Full HD (1920×1080)' },
                  ].map((chip) => {
                    const preset = SNS_PRESETS.find((p) => p.id === chip.id);
                    if (!preset) return null;
                    const active =
                      settings.width === preset.width && settings.height === preset.height;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-stone-700 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                <select
                  value={selectedPresetId}
                  onChange={handleCustomPresetDropdown}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="custom">직접 가로·세로 픽셀 입력 또는 전체 규격 보기...</option>
                  <optgroup label="네이버 블로그">
                    <option value="naver_thumb">네이버 블로그 썸네일 (800×800)</option>
                    <option value="naver_body">네이버 블로그 본문 (860×573)</option>
                  </optgroup>
                  <optgroup label="유튜브">
                    <option value="yt_thumb">유튜브 썸네일 (1280×720 HD)</option>
                    <option value="yt_banner">유튜브 채널 배너 (2560×1440)</option>
                  </optgroup>
                  <optgroup label="인스타그램">
                    <option value="insta_square">인스타그램 정사각형 (1080×1080)</option>
                    <option value="insta_portrait">인스타그램 세로 피드 (1080×1350)</option>
                    <option value="insta_story">인스타그램 스토리/릴스 (1080×1920)</option>
                  </optgroup>
                  <optgroup label="카카오톡 / 페이스북 / 웹 표준">
                    <option value="kakao_profile">카카오톡 프로필 (800×800)</option>
                    <option value="fb_post">페이스북 포스트 (1200×630)</option>
                    <option value="gen_fhd">Full HD 웹 표준 (1920×1080)</option>
                    <option value="gen_800">기본 웹 배너 (800×600)</option>
                  </optgroup>
                </select>
              </div>

              {/* 가로 / 세로 픽셀 입력 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">가로 너비 (px)</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={settings.width}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm font-mono font-bold text-[#2D2A26] focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">세로 높이 (px)</label>
                    <button
                      type="button"
                      onClick={() => onChange({ lockAspectRatio: !settings.lockAspectRatio })}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                        settings.lockAspectRatio
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-stone-500 border border-stone-200'
                      }`}
                    >
                      <i className={`fas ${settings.lockAspectRatio ? 'fa-link' : 'fa-unlink'} mr-1`}></i>
                      {settings.lockAspectRatio ? '비율 잠금' : '비율 자유'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={settings.height}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm font-mono font-bold text-[#2D2A26] focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* 비율 맞춤 방식 */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(
                  [
                    { mode: 'cover', label: '중앙 꽉 채우기 (권장)' },
                    { mode: 'contain', label: '잘림 없이 전체 포함' },
                    { mode: 'stretch', label: '비율 무시 꽉 맞춤' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => onChange({ fitMode: m.mode })}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                      settings.fitMode === m.mode
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-stone-600 border-indigo-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {settings.unit === 'target_kb' && (
            <div className="space-y-3">
              <label className="block text-xs font-black text-indigo-950">
                최대 몇 KB 이하로 용량을 줄일까요?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 300, 500, 1000].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => onChange({ targetKb: kb })}
                    className={`py-2.5 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      settings.targetKb === kb
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-stone-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {kb >= 1000 ? '1MB 이하' : `${kb}KB 이하`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. 화질(Quality) 선택 — 누구나 쉽게 고르는 3단 버튼 */}
      {/* ===================================================================== */}
      <div className="pt-4 border-t border-[#EBE6DD] space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-black text-[#2D2A26] flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
              3
            </span>
            <span>저장 화질 선택</span>
          </label>
          <span className="text-xs font-mono font-bold text-indigo-600">
            {Math.round(settings.quality * 100)}% 화질
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { q: 1.0, label: '최고 화질 (100%)', sub: '업스케일 · 인쇄 권장' },
              { q: 0.9, label: '표준 권장 화질 (90%)', sub: '화질 유지 + 용량 절약' },
              { q: 0.75, label: '가벼운 용량 우선 (75%)', sub: '빠른 웹 업로드용' },
            ] as const
          ).map((item) => {
            const active = Math.abs(settings.quality - item.q) < 0.03;
            return (
              <button
                key={item.q}
                type="button"
                onClick={() => onChange({ quality: item.q })}
                className={`py-2.5 px-2 rounded-xl text-center border cursor-pointer transition-all ${
                  active
                    ? 'bg-indigo-50 text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                    : 'bg-[#FAF8F5] text-stone-700 border-[#EBE6DD] hover:bg-stone-100'
                }`}
              >
                <div className="text-xs font-black">{item.label}</div>
                <div className="text-[10px] text-stone-500 mt-0.5">{item.sub}</div>
              </button>
            );
          })}
        </div>

        {isUpscaleMode && settings.format !== 'image/png' && (
          <div className="rounded-xl bg-indigo-50/70 border border-indigo-200 px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-indigo-950">
              <i className="fas fa-lightbulb text-amber-500 mr-1.5"></i>
              업스케일 화질 손실을 0%로 보존하려면 <strong>PNG 고화질(무손실)</strong> 저장을 추천합니다.
            </span>
            <button
              type="button"
              onClick={() => onChange({ format: 'image/png' })}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black shrink-0 cursor-pointer"
            >
              PNG 무손실로 변경
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 하단 이전 스텝 / 지금 변환 시작하기 대형 CTA 버튼 */}
      {/* ===================================================================== */}
      <div className="pt-4 border-t border-[#EBE6DD] flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={onBackToStep1}
          disabled={isProcessing}
          className="py-4 px-5 bg-[#FAF8F5] hover:bg-stone-200/70 text-[#2D2A26] border border-[#EBE6DD] text-xs sm:text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <i className="fas fa-arrow-left"></i>
          <span>이전 스텝 (이미지 추가/삭제)</span>
        </button>

        <button
          type="button"
          data-screenshot-click="result"
          onClick={onStartProcess}
          disabled={isProcessing || itemCount === 0}
          className="flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>
                {isUpscaleMode
                  ? '브라우저에서 고화질 업스케일 실행 중... 잠시만 기다려 주세요'
                  : '이미지 변환 중입니다... 잠시만 기다려 주세요'}
              </span>
            </>
          ) : (
            <>
              <i className="fas fa-wand-magic-sparkles text-amber-300"></i>
              <span>
                {isUpscaleMode
                  ? `지금 고화질 업스케일 시작하기 (${itemCount}장)`
                  : `지금 변환 시작하기 (${itemCount}장)`}
              </span>
              <i className="fas fa-arrow-right"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
