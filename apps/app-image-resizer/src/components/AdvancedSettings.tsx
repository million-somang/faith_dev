import React, { useState } from 'react';
import { OutputFormat, ResizeSettings } from '../types/index';

interface AdvancedSettingsProps {
  settings: ResizeSettings;
  onChange: (updated: Partial<ResizeSettings>) => void;
}

export default function AdvancedSettings({ settings, onChange }: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatOptions: { label: string; value: OutputFormat; desc: string }[] = [
    { label: '원본 유지', value: 'original', desc: '업로드된 원본의 확장자 유지' },
    { label: 'WebP', value: 'image/webp', desc: '구글 권장 고효율 차세대 웹 포맷' },
    { label: 'JPEG (JPG)', value: 'image/jpeg', desc: '사진 및 보편적 호환성 최고' },
    { label: 'PNG', value: 'image/png', desc: '투명 배경 및 선명한 그래픽 보존' },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs overflow-hidden mb-6 transition-all">
      {/* 아코디언 헤더 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <i className="fas fa-sliders-h text-indigo-600 text-sm"></i>
          <span className="text-sm font-bold text-[#2D2A26]">고급 최적화 설정</span>
          <span className="text-[10px] text-stone-400 font-mono">
            ({settings.format === 'original' ? '원본포맷' : settings.format.replace('image/', '').toUpperCase()} ·{' '}
            {Math.round(settings.quality * 100)}% 품질)
          </span>
        </div>
        <i
          className={`fas fa-chevron-down text-xs text-stone-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        ></i>
      </button>

      {/* 아코디언 본문 */}
      {isOpen && (
        <div className="p-5 border-t border-[#EBE6DD] bg-[#FAF8F5]/50 space-y-4 text-xs animate-fade-in">
          {/* 출력 포맷 선택 */}
          <div>
            <label className="block font-bold text-stone-700 mb-2">출력 이미지 포맷</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {formatOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ format: opt.value })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.format === opt.value
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-2xs ring-1 ring-indigo-500'
                      : 'border-[#EBE6DD] bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <p className="font-bold text-xs">{opt.label}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 압축 품질 슬라이더 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-stone-700">압축 품질 (Quality)</label>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.quality}
              onChange={(e) => onChange({ quality: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
              <span>최대 압축 (작은 용량)</span>
              <span>권장 (85%)</span>
              <span>무손실 수준 (고화질)</span>
            </div>
          </div>

          {/* 파일명 접미사 규칙 */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">변환 파일명 접미사</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.filenameSuffix}
                onChange={(e) => onChange({ filenameSuffix: e.target.value })}
                placeholder="_resized"
                className="w-48 px-3 py-2 rounded-xl border border-[#EBE6DD] bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-stone-400">
                예: image<span className="text-indigo-600 font-bold font-mono">{settings.filenameSuffix || '_resized'}</span>.jpg
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
