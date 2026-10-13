import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@faithportal/ui';
import { GUIDES_DATA } from '../../data/guidesData';

export const SidebarGuidesWidget: React.FC = () => {
    // 엄선된 인기 칼럼 4선
    const popularGuides = GUIDES_DATA.slice(0, 4);

    return (
        <div className="flex flex-col gap-4">
            {/* 1. 주간 인기 지식 칼럼 TOP 4 */}
            <Card className="p-5 bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all rounded-3xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-sm shadow-teal-200">
                            <i className="fas fa-bookmark"></i>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                                주간 추천 칼럼
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
                                    TOP
                                </span>
                            </h3>
                        </div>
                    </div>
                    <Link
                        to="/guides"
                        className="text-[11px] font-extrabold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors"
                    >
                        <span>25편 전체</span>
                        <i className="fas fa-chevron-right text-[8px]"></i>
                    </Link>
                </div>

                <div className="space-y-2.5">
                    {popularGuides.map((guide, idx) => (
                        <Link
                            key={guide.slug}
                            to={`/guides/${guide.slug}`}
                            className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all group"
                        >
                            <span className="w-5 h-5 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-bold text-teal-700">
                                        {guide.categoryLabel}
                                    </span>
                                    <span className="text-[10px] text-slate-400">· {guide.readTime}</span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-1 leading-snug">
                                    {guide.title}
                                </h4>
                            </div>
                        </Link>
                    ))}
                </div>

                <Link
                    to="/guides"
                    className="mt-3.5 w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-center text-xs rounded-xl shadow-xs block transition-all active:scale-98"
                >
                    지식 아카이브 전체 읽기
                </Link>
            </Card>

            {/* 2. 스마트 생활·금융 도구 퀵패스 */}
            <Card className="p-5 bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all rounded-3xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center text-xs font-black shadow-sm shadow-indigo-200">
                            <i className="fas fa-sliders-h"></i>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                            스마트 계산기 & 도구
                        </h3>
                    </div>
                    <Link
                        to="/lifestyle"
                        className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
                    >
                        <span>더보기</span>
                        <i className="fas fa-chevron-right text-[8px]"></i>
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left">
                    <Link
                        to="/lifestyle"
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition-all flex flex-col group"
                    >
                        <i className="fas fa-coins text-amber-500 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                        <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">예·적금 계산</span>
                        <span className="text-[10px] text-slate-400">단리·복리 세후수령</span>
                    </Link>
                    <Link
                        to="/lifestyle"
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 transition-all flex flex-col group"
                    >
                        <i className="fas fa-file-invoice-dollar text-emerald-500 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                        <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-600">퇴직금 계산</span>
                        <span className="text-[10px] text-slate-400">법정 3개월 평균</span>
                    </Link>
                    <Link
                        to="/lifestyle"
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition-all flex flex-col group"
                    >
                        <i className="fas fa-file-image text-indigo-500 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                        <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">WebP 변환기</span>
                        <span className="text-[10px] text-slate-400">최대 80% 압축</span>
                    </Link>
                    <Link
                        to="/lifestyle"
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 transition-all flex flex-col group"
                    >
                        <i className="fas fa-calendar-alt text-purple-500 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                        <span className="font-bold text-xs text-slate-800 group-hover:text-purple-600">D-Day 계산기</span>
                        <span className="text-[10px] text-slate-400">기념일·카운트다운</span>
                    </Link>
                </div>
            </Card>
        </div>
    );
};
export default SidebarGuidesWidget;
