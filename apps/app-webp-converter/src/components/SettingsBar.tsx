import React from 'react';
import type { ConversionSettings } from '../types/index';

interface SettingsBarProps {
    settings: ConversionSettings;
    onChangeSettings: (settings: ConversionSettings) => void;
    onConvert: () => void;
    isConverting: boolean;
    disabled: boolean;
}

export default function SettingsBar({
    settings,
    onChangeSettings,
    onConvert,
    isConverting,
    disabled,
}: SettingsBarProps) {
    const qualityPresets = [
        { label: '80% (추천 ✨)', value: 0.8, lossless: false },
        { label: '90% (고화질)', value: 0.9, lossless: false },
        { label: '70% (초경량)', value: 0.7, lossless: false },
        { label: '100% (무손실)', value: 1.0, lossless: true },
    ];

    const resizeOptions = [
        { label: '원본 크기 유지', value: 0 },
        { label: '1920px (FHD)', value: 1920 },
        { label: '1280px (HD)', value: 1280 },
        { label: '800px (모바일)', value: 800 },
    ];

    return (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            {/* 1. 압축 품질 프리셋 퀵 칩 */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <i className="fas fa-sliders-h text-indigo-600 text-[11px]"></i>
                        <span>압축 품질 (Quality)</span>
                    </label>
                    <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                        {settings.lossless ? '무손실 (100%)' : `${Math.round(settings.quality * 100)}%`}
                    </span>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                    {qualityPresets.map((preset) => {
                        const isSelected =
                            settings.lossless === preset.lossless &&
                            (preset.lossless || Math.abs(settings.quality - preset.value) < 0.05);

                        return (
                            <button
                                key={preset.label}
                                type="button"
                                data-screenshot-click="action"
                                onClick={() =>
                                    onChangeSettings({
                                        ...settings,
                                        quality: preset.value,
                                        lossless: preset.lossless,
                                    })
                                }
                                className={`px-3 py-2 text-[11px] font-bold rounded-xl border shrink-0 transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-2xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>

                {/* 미세 조절 슬라이더 */}
                {!settings.lossless && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <input
                            type="range"
                            min="0.1"
                            max="0.95"
                            step="0.05"
                            value={settings.quality}
                            onChange={(e) =>
                                onChangeSettings({
                                    ...settings,
                                    quality: parseFloat(e.target.value),
                                    lossless: false,
                                })
                            }
                            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                        />
                    </div>
                )}
            </div>

            {/* 2. 해상도 가로 너비 리사이즈 */}
            <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                    <span className="flex items-center gap-1.5">
                        <i className="fas fa-expand text-indigo-600 text-[11px]"></i>
                        <span>가로 최대 너비 (Resize)</span>
                    </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {resizeOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChangeSettings({ ...settings, maxWidth: opt.value })}
                            className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                                settings.maxWidth === opt.value
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-2xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. 대형 변환 실행 CTA 버튼 */}
            <button
                type="button"
                onClick={onConvert}
                disabled={disabled || isConverting}
                data-screenshot-click="result"
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:cursor-not-allowed"
            >
                {isConverting ? (
                    <>
                        <i className="fas fa-spinner fa-spin text-amber-300 text-sm"></i>
                        <span>WebP 무손실 압축 변환 중...</span>
                    </>
                ) : (
                    <>
                        <i className="fas fa-bolt text-amber-300 text-base"></i>
                        <span>WebP로 초고속 변환 &amp; 압축하기</span>
                    </>
                )}
            </button>
        </div>
    );
}
