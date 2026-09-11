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
출처: FaithPortal WebP 변환기`;

        navigator.clipboard.writeText(text);
        alert('변환 리포트가 클립보드에 복사되었습니다! 📋');
    };

    return (
        <div
            data-screenshot-point="result"
            className="min-h-[calc(850px-140px)] flex flex-col justify-between space-y-4 animate-fade-in"
        >
            {/* 상단 및 중앙 콘텐츠 영역 */}
            <div className="space-y-3.5">
                {/* 1. 메인 결과 리포트 카드 (100% 순백색 프리미엄 뉴모피즘) */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 space-y-4">
                    {/* 상단 헤더 바 */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onBackToInput}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                                title="입력 화면으로 돌아가기"
                            >
                                <i className="fas fa-arrow-left text-xs"></i>
                            </button>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                                    WEBP COMPRESSION REPORT
                                </span>
                                <h4 className="text-base font-black text-slate-900">최종 변환 결과 리포트</h4>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleCopyReport}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                            >
                                <i className="fas fa-copy text-[11px]"></i>
                                <span>리포트 복사</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. 거대 히어로 메트릭 카드 (Hero Metric) */}
                    <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-cyan-50/60 rounded-2xl p-5 border border-indigo-100 text-center space-y-1.5 shadow-xs">
                        <span className="text-xs font-bold text-indigo-900/80">평균 데이터 용량 절감률</span>
                        <div className="text-3xl sm:text-4xl font-black text-indigo-600 tracking-tight">
                            {avgReductionPercent}%{' '}
                            <span className="text-lg sm:text-xl font-extrabold text-emerald-600 ml-1">
                                용량 압축 성공
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium pt-1">
                            총 {formatBytes(totalOriginalBytes)} ➔ {formatBytes(totalConvertedBytes)} (
                            <strong className="text-emerald-600 font-black">{formatBytes(savedBytes)}</strong> 절약)
                        </p>

                        {/* 시각화 프로그레스 바 */}
                        <div className="pt-2">
                            <div className="w-full bg-white border border-slate-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                                    style={{
                                        width: `${totalOriginalBytes > 0 ? Math.max(10, Math.round((totalConvertedBytes / totalOriginalBytes) * 100)) : 100}%`,
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 px-1">
                                <span>압축 후 WebP ({formatBytes(totalConvertedBytes)})</span>
                                <span>원본 용량 ({formatBytes(totalOriginalBytes)})</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. 2분할 요약 카드 */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-left">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                                <i className="fas fa-images text-indigo-500"></i>
                                <span>변환 완료 파일</span>
                            </div>
                            <div className="text-lg font-black text-slate-900">
                                {doneItems.length}개
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-left">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                                <i className="fas fa-shield-alt text-emerald-500"></i>
                                <span>로컬 프라이버시</span>
                            </div>
                            <div className="text-lg font-black text-emerald-600">
                                100% 안전
                            </div>
                        </div>
                    </div>

                    {/* 4. 변환 완료 파일 목록 및 개별 저장 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                            <span>변환 완료 파일 상세</span>
                            <span className="text-[11px] text-indigo-600">{doneItems.length}개 완료</span>
                        </div>

                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {doneItems.map((item) => {
                                const newName = item.name.replace(/\.[^/.]+$/, '') + '.webp';
                                const itemReduction = item.reductionPercent || 0;

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <img
                                                src={item.convertedUrl || item.previewUrl}
                                                alt={newName}
                                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 bg-white"
                                            />
                                            <div className="truncate text-left">
                                                <div className="font-bold text-slate-900 truncate text-[11px]">
                                                    {newName}
                                                </div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                                                    <span className="line-through">{formatBytes(item.originalSize)}</span>
                                                    <i className="fas fa-arrow-right text-[8px] text-slate-400"></i>
                                                    <span className="text-indigo-600 font-bold">
                                                        {formatBytes(item.convertedSize || 0)}
                                                    </span>
                                                    <span className="text-emerald-600 font-black">
                                                        (-{itemReduction}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (item.convertedBlob) downloadBlob(item.convertedBlob, newName);
                                            }}
                                            className="px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shrink-0 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                        >
                                            <i className="fas fa-download text-[10px]"></i>
                                            <span>저장</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 5. 정밀 분석 인사이트 패널 (화면 하단 알차게 채우기) */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <i className="fas fa-tachometer-alt text-xs"></i>
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed text-left">
                            <p className="font-extrabold text-emerald-950 mb-0.5">웹 코어 바이탈(LCP) 가속 효과</p>
                            <p className="text-slate-600 text-[11px]">
                                WebP 이미지를 웹사이트나 블로그에 게시하면 로딩 속도가 <strong>최대 2.5배 빨라지며</strong>, 구글 검색엔진(SEO) 상위 랭킹 점수 획득에 크게 기여합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. 하단 밀착형 2단 액션 독 (Action Dock) */}
            <div className="pt-2 flex gap-2">
                <button
                    type="button"
                    onClick={onResetAll}
                    className="flex-1 py-3.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs transition-all cursor-pointer active:scale-98"
                >
                    <i className="fas fa-redo mr-1.5 text-[11px] text-slate-400"></i>
                    <span>새 이미지 변환하기</span>
                </button>
                <button
                    type="button"
                    onClick={() => downloadAllAsZip(doneItems)}
                    className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                >
                    <i className="fas fa-file-archive text-amber-300"></i>
                    <span>전체 ZIP 다운로드</span>
                </button>
            </div>
        </div>
    );
}
