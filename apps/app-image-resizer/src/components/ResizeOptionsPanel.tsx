import React, { useState } from 'react';
import { ResizeSettings, ResizeUnit, FitMode, SNS_PRESETS, PresetOption } from '../types/index';

interface ResizeOptionsPanelProps {
  settings: ResizeSettings;
  onChange: (updated: Partial<ResizeSettings>) => void;
}

export default function ResizeOptionsPanel({ settings, onChange }: ResizeOptionsPanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');

  const handleUnitChange = (unit: ResizeUnit) => {
    onChange({ unit });
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
      className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-[#EBE6DD] shadow-xs space-y-6"
    >
      <h3 className="text-lg font-black text-[#2D2A26] flex items-center gap-2">
        <i className="fas fa-sliders text-indigo-600 text-sm"></i>
        <span>크기 조정 옵션</span>
      </h3>

      {/* 4대 모드 탭 (스크린샷 일치) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#FAF8F5] rounded-2xl border border-[#EBE6DD]">
        <button
          type="button"
          onClick={() => handleUnitChange('pixel')}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            settings.unit === 'pixel'
              ? 'bg-white text-indigo-700 shadow-2xs border border-[#EBE6DD]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <i className="fas fa-th-large text-sm mb-1"></i>
          <span>픽셀 단위</span>
        </button>

        <button
          type="button"
          onClick={() => handleUnitChange('percent')}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            settings.unit === 'percent'
              ? 'bg-white text-indigo-700 shadow-2xs border border-[#EBE6DD]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <i className="fas fa-percent text-sm mb-1"></i>
          <span>백분율 단위</span>
        </button>

        <button
          type="button"
          onClick={() => handleUnitChange('longest')}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            settings.unit === 'longest'
              ? 'bg-white text-indigo-700 shadow-2xs border border-[#EBE6DD]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <i className="fas fa-ruler-horizontal text-sm mb-1"></i>
          <span>긴 변 단위</span>
        </button>

        <button
          type="button"
          onClick={() => handleUnitChange('target_kb')}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            settings.unit === 'target_kb'
              ? 'bg-white text-indigo-700 shadow-2xs border border-[#EBE6DD]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <i className="fas fa-file-shield text-sm mb-1"></i>
          <span>목표 용량 (KB)</span>
        </button>
      </div>

      <p className="text-xs text-stone-500 font-medium">
        {settings.unit === 'pixel' && '모든 이미지를 다음 정확한 크기로 조정합니다:'}
        {settings.unit === 'percent' && '원본 크기에 백분율 비율을 곱해 축소 또는 확대합니다:'}
        {settings.unit === 'longest' && '가로·세로 중 더 긴 축을 지정된 픽셀로 맞추고 비율을 자동 유지합니다:'}
        {settings.unit === 'target_kb' && '목표 파일 용량 이하가 되도록 해상도 및 화질을 자동 최적화합니다:'}
      </p>

      {/* ── 1. 픽셀 모드 세부 컨트롤 ── */}
      {settings.unit === 'pixel' && (
        <div className="space-y-4 animate-fade-in">
          {/* 자주 쓰는 프리셋 선택 & 플랫폼 아이콘들 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-700">자주 쓰는 프리셋 선택</label>
              {/* 플랫폼 빠른 선택 아이콘 버튼들 */}
              <div className="flex items-center gap-1.5 text-stone-500 text-xs">
                <button
                  type="button"
                  onClick={() => handlePresetSelect(SNS_PRESETS[0]!)}
                  title="네이버 블로그 썸네일 (800x800)"
                  className="w-6 h-6 rounded-md hover:bg-emerald-50 hover:text-emerald-700 font-black flex items-center justify-center transition-colors"
                >
                  N
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(SNS_PRESETS[2]!)}
                  title="유튜브 썸네일 (1280x720)"
                  className="w-6 h-6 rounded-md hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-youtube"></i>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(SNS_PRESETS[4]!)}
                  title="인스타그램 피드 (1080x1080)"
                  className="w-6 h-6 rounded-md hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-instagram"></i>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(SNS_PRESETS[7]!)}
                  title="카카오톡 프로필 (800x800)"
                  className="w-6 h-6 rounded-md hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-comment"></i>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(SNS_PRESETS[9]!)}
                  title="페이스북 포스트 (1200x630)"
                  className="w-6 h-6 rounded-md hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-facebook-f"></i>
                </button>
              </div>
            </div>

            {/* 프리셋 드롭다운 */}
            <select
              value={selectedPresetId}
              onChange={handleCustomPresetDropdown}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBE6DD] bg-white text-xs font-semibold text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="custom">직접 픽셀 입력...</option>
              <optgroup label="네이버">
                <option value="naver_thumb">네이버 블로그 썸네일 (800×800)</option>
                <option value="naver_body">네이버 블로그 본문 (860×573)</option>
              </optgroup>
              <optgroup label="유튜브">
                <option value="yt_thumb">유튜브 썸네일 (1280×720 HD)</option>
                <option value="yt_banner">유튜브 채널 아트 (2560×1440)</option>
              </optgroup>
              <optgroup label="인스타그램">
                <option value="insta_square">인스타그램 정사각형 (1080×1080)</option>
                <option value="insta_portrait">인스타그램 세로 피드 (1080×1350)</option>
                <option value="insta_story">인스타그램 스토리/릴스 (1080×1920)</option>
              </optgroup>
              <optgroup label="카카오톡 / 페이스북">
                <option value="kakao_profile">카카오톡 프로필 (800×800)</option>
                <option value="kakao_share">카카오톡 공유 썸네일 (800×400)</option>
                <option value="fb_post">페이스북 피드 포스트 (1200×630)</option>
              </optgroup>
              <optgroup label="일반 표준 규격">
                <option value="gen_fhd">Full HD 웹 표준 (1920×1080)</option>
                <option value="gen_hd">HD 컴팩트 (1280×720)</option>
                <option value="gen_800">기본 웹 배너 (800×600)</option>
              </optgroup>
            </select>
          </div>

          {/* 너비 & 높이 입력창 */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">너비 (픽셀):</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBE6DD] bg-white text-xs font-mono font-bold text-right pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                  px
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700">높이 (픽셀):</label>
                <button
                  type="button"
                  onClick={() => onChange({ lockAspectRatio: !settings.lockAspectRatio })}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    settings.lockAspectRatio
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                  title="가로/세로 비율 연동 토글"
                >
                  <i className={`fas ${settings.lockAspectRatio ? 'fa-link' : 'fa-unlink'} mr-0.5`}></i>
                  {settings.lockAspectRatio ? '비율 고정됨' : '비율 해제'}
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBE6DD] bg-white text-xs font-mono font-bold text-right pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                  px
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. 백분율 모드 세부 컨트롤 ── */}
      {settings.unit === 'percent' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-700">크기 비율 (Scale %)</label>
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
              {settings.percent}%
            </span>
          </div>

          <div className="flex gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onChange({ percent: pct })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  settings.percent === pct
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-[#EBE6DD] bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={settings.percent}
            onChange={(e) => onChange({ percent: parseInt(e.target.value) || 100 })}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      )}

      {/* ── 3. 긴 변 기준 모드 세부 컨트롤 ── */}
      {settings.unit === 'longest' && (
        <div className="space-y-3 animate-fade-in">
          <label className="block text-xs font-bold text-stone-700">긴 변 최대 길이 (픽셀)</label>
          <div className="flex gap-2 mb-2">
            {[800, 1080, 1280, 1920].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => onChange({ longestSide: sz })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  settings.longestSide === sz
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-[#EBE6DD] bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                {sz}px
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number"
              min="100"
              max="10000"
              value={settings.longestSide}
              onChange={(e) => onChange({ longestSide: parseInt(e.target.value) || 800 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBE6DD] bg-white text-xs font-mono font-bold text-right pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
              px
            </span>
          </div>
        </div>
      )}

      {/* ── 4. 목표 용량 (KB) 모드 세부 컨트롤 ── */}
      {settings.unit === 'target_kb' && (
        <div className="space-y-3 animate-fade-in">
          <label className="block text-xs font-bold text-stone-700">목표 파일 용량 (최대 한도)</label>
          <div className="flex gap-2 mb-2">
            {[100, 300, 500, 1000].map((kb) => (
              <button
                key={kb}
                type="button"
                onClick={() => onChange({ targetKb: kb })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  settings.targetKb === kb
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-[#EBE6DD] bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                {kb >= 1000 ? `${kb / 1000}MB` : `${kb}KB`}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number"
              min="20"
              max="50000"
              value={settings.targetKb}
              onChange={(e) => onChange({ targetKb: parseInt(e.target.value) || 300 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBE6DD] bg-white text-xs font-mono font-bold text-right pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
              KB 이하
            </span>
          </div>
        </div>
      )}

      {/* ── 이미지 비율 및 맞춤 방식 (Fit Mode - 스크린샷 100% 일치) ── */}
      <div className="pt-4 border-t border-[#EBE6DD]">
        <label className="block text-xs font-bold text-stone-700 mb-2">이미지 비율 및 맞춤 방식:</label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <button
            type="button"
            onClick={() => onChange({ fitMode: 'cover' })}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
              settings.fitMode === 'cover'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs'
                : 'border-[#EBE6DD] bg-white text-stone-600 hover:border-stone-300'
            }`}
          >
            <i className="fas fa-crop-alt text-xs"></i>
            <span>중앙 크롭 (Cover)</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ fitMode: 'contain' })}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
              settings.fitMode === 'contain'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs'
                : 'border-[#EBE6DD] bg-white text-stone-600 hover:border-stone-300'
            }`}
          >
            <i className="fas fa-compress-arrows-alt text-xs"></i>
            <span>비율 유지 (Contain)</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ fitMode: 'stretch' })}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
              settings.fitMode === 'stretch'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs'
                : 'border-[#EBE6DD] bg-white text-stone-600 hover:border-stone-300'
            }`}
          >
            <i className="fas fa-arrows-alt text-xs"></i>
            <span>강제 맞춤 (Stretch)</span>
          </button>
        </div>

        {/* 맞춤 방식 실시간 설명 문구 */}
        <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
          {settings.fitMode === 'cover' && '비율을 유지하며 설정 영역을 가득 채우도록 중앙 기준 크롭합니다 (권장).'}
          {settings.fitMode === 'contain' && '설정 크기 안에 원본 이미지가 모두 들어가도록 여백을 두고 크기를 맞춥니다.'}
          {settings.fitMode === 'stretch' && '비율과 상관없이 입력한 너비와 높이에 정확히 일치하도록 강제 변형합니다.'}
        </p>
      </div>

      {/* ── 원본보다 크게 확대 금지 체크박스 (스크린샷 일치) ── */}
      <div className="pt-3 border-t border-[#EBE6DD]">
        <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.preventUpscale}
            onChange={(e) => onChange({ preventUpscale: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
          />
          <span>원본보다 크게 확대 금지</span>
        </label>
        <p className="text-[10px] text-stone-400 pl-6 mt-0.5">
          원본 해상도가 목표 설정값보다 작을 경우 화질 저하를 방지하기 위해 강제로 늘리지 않습니다.
        </p>
      </div>
    </div>
  );
}
