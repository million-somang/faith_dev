import React, { useState } from 'react';
import {
  ResizeSettings,
  OutputFormat,
  SNS_PRESETS,
  PresetOption,
} from '../types/index';

interface ResizeOptionsPanelProps {
  settings: ResizeSettings;
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

export default function ResizeOptionsPanel({
  settings,
  onChange,
  itemCount,
  isProcessing,
  onBackToStep1,
  onStartProcess,
}: ResizeOptionsPanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');

  // '원본 크기 그대로(100%)' 상태 판별
  const isKeepOriginalSize = settings.unit === 'percent' && settings.percent === 100;

  const handleSelectKeepOriginalSize = () => {
    onChange({ unit: 'percent', percent: 100 });
  };

  const handleSelectPercentScale = () => {
    onChange({ unit: 'percent', percent: settings.percent === 100 ? 75 : settings.percent });
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
      {/* 2. 이미지 크기(해상도) 조절 방식 선택 */}
      {/* ===================================================================== */}
      <div className="pt-4 border-t border-[#EBE6DD] space-y-4">
        <label className="text-xs sm:text-sm font-black text-[#2D2A26] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
            2
          </span>
          <span>이미지 크기(해상도)는 어떻게 맞출까요?</span>
        </label>

        {/* 4대 크기 조절 모드 버튼 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleSelectKeepOriginalSize}
            className={`py-3 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              isKeepOriginalSize
                ? 'bg-indigo-50 text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                : 'bg-[#FAF8F5] text-stone-600 border border-[#EBE6DD] hover:bg-stone-100'
            }`}
          >
            <i className={`fas fa-expand text-sm ${isKeepOriginalSize ? 'text-indigo-600' : 'text-stone-400'}`}></i>
            <span>원본 크기 그대로</span>
            <span className="text-[10px] font-normal text-stone-500">크기 변경 안 함</span>
          </button>

          <button
            type="button"
            onClick={handleSelectPercentScale}
            className={`py-3 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              settings.unit === 'percent' && settings.percent !== 100
                ? 'bg-indigo-50 text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                : 'bg-[#FAF8F5] text-stone-600 border border-[#EBE6DD] hover:bg-stone-100'
            }`}
          >
            <i
              className={`fas fa-percent text-sm ${
                settings.unit === 'percent' && settings.percent !== 100 ? 'text-indigo-600' : 'text-stone-400'
              }`}
            ></i>
            <span>비율로 축소 (%)</span>
            <span className="text-[10px] font-normal text-stone-500">50% · 75% 축소</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ unit: 'pixel' })}
            className={`py-3 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              settings.unit === 'pixel'
                ? 'bg-indigo-50 text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                : 'bg-[#FAF8F5] text-stone-600 border border-[#EBE6DD] hover:bg-stone-100'
            }`}
          >
            <i className={`fas fa-th-large text-sm ${settings.unit === 'pixel' ? 'text-indigo-600' : 'text-stone-400'}`}></i>
            <span>픽셀 · SNS 규격</span>
            <span className="text-[10px] font-normal text-stone-500">블로그·유튜브·직접입력</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ unit: 'target_kb' })}
            className={`py-3 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              settings.unit === 'target_kb'
                ? 'bg-indigo-50 text-indigo-950 border-2 border-indigo-600 shadow-2xs'
                : 'bg-[#FAF8F5] text-stone-600 border border-[#EBE6DD] hover:bg-stone-100'
            }`}
          >
            <i
              className={`fas fa-weight-hanging text-sm ${
                settings.unit === 'target_kb' ? 'text-indigo-600' : 'text-stone-400'
              }`}
            ></i>
            <span>목표 용량 맞춤</span>
            <span className="text-[10px] font-normal text-stone-500">300KB · 500KB 이하</span>
          </button>
        </div>

        {/* 선택된 크기 모드별 세부 설정 박스 */}
        <div className="bg-indigo-50/40 rounded-2xl p-4 sm:p-5 border border-indigo-100 space-y-4">
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
              { q: 0.95, label: '선명한 최고 화질 (95%)', sub: '인쇄 · 포트폴리오용' },
              { q: 0.85, label: '표준 권장 화질 (85%)', sub: '화질 유지 + 용량 절약' },
              { q: 0.7, label: '가벼운 용량 우선 (70%)', sub: '빠른 웹 업로드용' },
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
              <span>이미지 변환 중입니다... 잠시만 기다려 주세요</span>
            </>
          ) : (
            <>
              <i className="fas fa-wand-magic-sparkles text-amber-300"></i>
              <span>지금 변환 시작하기 ({itemCount}장)</span>
              <i className="fas fa-arrow-right"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
