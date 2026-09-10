import React from 'react';
import type { ImageFileItem } from '../types/index';
import { formatBytes, downloadBlob, downloadAllAsZip } from '../utils/webpConverter';

interface ResultReportProps {
    items: ImageFileItem[];
    onBackToInput: () => void;
    onResetAll: () => void;
}

export default function ResultReport({ items, onBackToInput, onResetAll }: ResultReportProps) {
    const doneItems = items.filter((item) => item.status === 'done' && item.convertedBlob);

    const totalOriginalBytes = doneItems.reduce((acc, cur) => acc + cur.originalSize, 0);
    const totalConvertedBytes = doneItems.reduce((acc, cur) => acc + (cur.convertedSize || 0), 0);
    const savedBytes = Math.max(0, totalOriginalBytes - totalConvertedBytes);
    const avgReductionPercent =
        totalOriginalBytes > 0 ? Math.round((savedBytes / totalOriginalBytes) * 100) : 0;

    const handleCopyReport = () => {
        const text = `[WebP 변환 & 무손실 압축 결과 보고서]
• 변환 파일: 총 ${doneItems.length}개
• 원본 총 용량: ${formatBytes(totalOriginalBytes)}
• 압축 후 용량: ${formatBytes(totalConvertedBytes)}
• 절감된 용량: ${formatBytes(savedBytes)} (평균 ${avgReductionPercent}% 절감)
• 보안: 100% 브라우저 로컬 메모리 처리 (서버 전송 $0)
출처: VERA WebP 변환기 (veranex.app)`;

        navigator.clipboard.writeText(text);
        alert('변환 리포트가 클립보드에 복사되었습니다! 📋');
    };

    return (
        <div
            data-screenshot-point="result"
            className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-800/40 space-y-5 animate-fade-in"
        >
            {/* 1. 상단 액션 바 */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onBackToInput}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                        title="입력 화면으로 돌아가기"
                    >
                        <i className="fas fa-arrow-left text-xs"></i>
                    </button>
                    <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                            WEBP COMPRESSION REPORT
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white">최종 변환 결과 리포트</h4>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleCopyReport}
                        className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all flex items-center gap-1 cursor-pointer"
                    >
                        <i className="fas fa-copy text-[11px]"></i>
                        <span>리포트 복사</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadAllAsZip(doneItems)}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                    >
                        <i className="fas fa-download text-[11px]"></i>
                        <span>ZIP 일괄 다운로드</span>
                    </button>
                </div>
            </div>

            {/* 2. 거대 히어로 메트릭 (Hero Metric) */}
            <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 text-center space-y-1">
                <span className="text-xs text-cyan-200 font-bold">평균 데이터 절감률</span>
                <div className="text-3xl sm:text-4xl font-black text-cyan-300 tracking-tight">
                    {avgReductionPercent}%{' '}
                    <span className="text-lg sm:text-xl font-bold text-emerald-400 ml-1">용량 절감</span>
                </div>
                <p className="text-[11px] text-slate-300">
                    총 {formatBytes(totalOriginalBytes)} ➔ {formatBytes(totalConvertedBytes)} (
                    <strong className="text-emerald-300 font-bold">{formatBytes(savedBytes)}</strong> 절약)
                </p>
            </div>

            {/* 3. 용량 비교 시각 바 */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-[11px] text-slate-300">
                    <span>원본 용량: {formatBytes(totalOriginalBytes)}</span>
                    <span className="text-cyan-300 font-bold">WebP: {formatBytes(totalConvertedBytes)}</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{
                            width: `${totalOriginalBytes > 0 ? Math.max(8, Math.round((totalConvertedBytes / totalOriginalBytes) * 100)) : 100}%`,
                        }}
                    ></div>
                </div>
            </div>

            {/* 4. 변환된 파일 목록 및 개별 다운로드 */}
            <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 px-1 block">
                    변환 완료 파일 ({doneItems.length}개)
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {doneItems.map((item) => {
                        const newName = item.name.replace(/\.[^/.]+$/, '') + '.webp';
                        const itemReduction = item.reductionPercent || 0;

                        return (
                            <div
                                key={item.id}
                                className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 flex items-center justify-between gap-3 text-xs transition-colors"
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <img
                                        src={item.convertedUrl || item.previewUrl}
                                        alt={newName}
                                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/20 bg-slate-800"
                                    />
                                    <div className="truncate text-left">
                                        <div className="font-bold text-white truncate text-xs">{newName}</div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                            <span className="line-through">{formatBytes(item.originalSize)}</span>
                                            <i className="fas fa-arrow-right text-[8px] text-slate-500"></i>
                                            <span className="text-cyan-300 font-bold">
                                                {formatBytes(item.convertedSize || 0)}
                                            </span>
                                            <span className="text-emerald-400 font-bold">(-{itemReduction}%)</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (item.convertedBlob) downloadBlob(item.convertedBlob, newName);
                                    }}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-cyan-500 hover:text-slate-900 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-500/30 shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    <i className="fas fa-download text-[10px]"></i>
                                    <span>저장</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 5. 하단 액션 버튼 */}
            <div className="pt-2 flex gap-2">
                <button
                    type="button"
                    onClick={onResetAll}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                    새 이미지 변환하기
                </button>
                <button
                    type="button"
                    onClick={() => downloadAllAsZip(doneItems)}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                    전체 ZIP 다운로드 📦
                </button>
            </div>
        </div>
    );
}
