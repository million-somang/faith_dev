'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DividendTaxCalculator from '@/components/finance/DividendTaxCalculator';
import MortgageDsrCalculator from '@/components/finance/MortgageDsrCalculator';
import SeveranceCalculator from '@/components/finance/SeveranceCalculator';
import { SoftLockModal } from '@/components/common/SoftLockModal';
import { getFinanceSeoItem } from '@/data/financeSeoData';
import { getGuideBySlug } from '@/data/guidesData';

function TabParamWatcher({
    onSelect,
}: {
    onSelect: (tab: 'dividend' | 'dsr' | 'severance') => void;
}) {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    useEffect(() => {
        if (tabParam === 'dividend' || tabParam === 'dsr' || tabParam === 'severance') {
            onSelect(tabParam);
        }
    }, [tabParam, onSelect]);

    return null;
}

export default function FinanceUtilPage() {
    const [showSoftLock, setShowSoftLock] = useState(false);
    const [activeTab, setActiveTab] = useState<'dividend' | 'dsr' | 'severance'>('dividend');

    const handleTabChange = (tab: 'dividend' | 'dsr' | 'severance') => {
        setActiveTab(tab);
    };

    const tabKeyMap: Record<'dividend' | 'dsr' | 'severance', string> = {
        dividend: 'dividend-tax',
        dsr: 'mortgage-dsr',
        severance: 'severance-irp',
    };

    const seoData = getFinanceSeoItem(tabKeyMap[activeTab]);
    const relatedGuide = seoData ? getGuideBySlug(seoData.relatedGuideSlug) : undefined;

    return (
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-8 sm:py-10 space-y-8">
            <Suspense fallback={null}>
                <TabParamWatcher onSelect={setActiveTab} />
            </Suspense>

            {/* 상단 네비게이션 브레드크럼 */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-2">
                <Link href="/" className="hover:text-blue-600">홈</Link>
                <span>/</span>
                <Link href="/finance" className="hover:text-blue-600">금융</Link>
                <span>/</span>
                <span className="text-amber-700 font-black">스마트 금융 계산기</span>
            </nav>

            {/* 시맨틱 H1 헤더 (SSR 상시 노출) */}
            <header className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-extrabold mb-3">
                    <i className="fas fa-calculator"></i> 2026 최신 세법 & 금융규제 반영
                </span>
                <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                    스마트 금융 시뮬레이터 - 미국 배당주 세금 · 주담대 DSR/LTV · 퇴직금 계산기
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    미국 주식·ETF 배당소득세(15%) 및 금융소득종합과세(2,000만 원) 진단, 스트레스 DSR 2단계 주택담보대출 한도 산출, 2026 법정 퇴직금 및 실업급여 모의계산을 한곳에서 즉시 확인하세요.
                </p>
            </header>

            {/* 대형 탭 메뉴 */}
            <div className="flex flex-wrap gap-2 sm:gap-3 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
                <button
                    type="button"
                    onClick={() => handleTabChange('dividend')}
                    className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        activeTab === 'dividend'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                    }`}
                >
                    <i className="fas fa-coins text-sm"></i>
                    <span>미국 배당주 & 세금</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('dsr')}
                    className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        activeTab === 'dsr'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                    }`}
                >
                    <i className="fas fa-home text-sm"></i>
                    <span>주담대 DSR / LTV</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('severance')}
                    className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        activeTab === 'severance'
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                    }`}
                >
                    <i className="fas fa-briefcase text-sm"></i>
                    <span>퇴직금 & 실업급여</span>
                </button>
            </div>

            {/* 선택된 계산기 컴포넌트 렌더링 */}
            <div className="animate-fade-in">
                {activeTab === 'dividend' && <DividendTaxCalculator />}
                {activeTab === 'dsr' && <MortgageDsrCalculator />}
                {activeTab === 'severance' && <SeveranceCalculator />}
            </div>

            {/* AEO 구조화 콘텐츠 섹션 (공식 · 시뮬레이션 · FAQ 상시 노출) */}
            {seoData && (
                <div className="mt-8 space-y-6">
                    <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                        <div>
                            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
                                <i className="fas fa-lightbulb text-amber-500"></i>
                                {seoData.shortTitle} 핵심 요약 & 산출 공식
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                                {seoData.directAnswer}
                            </p>
                        </div>

                        <div className="bg-blue-50/60 p-4 sm:p-5 rounded-2xl border border-blue-100 space-y-2.5">
                            <h3 className="text-sm sm:text-base font-extrabold text-blue-900">
                                {seoData.formula.title}
                            </h3>
                            <p className="text-xs sm:text-sm font-mono font-bold text-blue-800 bg-white px-3.5 py-2.5 rounded-xl border border-blue-100">
                                {seoData.formula.expression}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                {seoData.formula.description}
                            </p>
                        </div>

                        <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-100 space-y-1.5">
                            <h3 className="text-sm sm:text-base font-extrabold text-emerald-900">
                                실전 계산 시뮬레이션 사례
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700">
                                <strong>조건:</strong> {seoData.example.scenario}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-700">
                                <strong>계산:</strong> {seoData.example.calculation}
                            </p>
                            <p className="text-xs sm:text-sm font-extrabold text-emerald-800">
                                <strong>결과:</strong> {seoData.example.result}
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                자주 묻는 질문 (FAQ)
                            </h3>
                            {seoData.faqs.map((faq, idx) => (
                                <details
                                    key={idx}
                                    open
                                    className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4"
                                >
                                    <summary className="font-bold text-xs sm:text-sm text-slate-900 cursor-pointer">
                                        Q{idx + 1}. {faq.question}
                                    </summary>
                                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2">
                                        {faq.answer}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </section>

                    {relatedGuide && (
                        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs text-teal-600 font-bold">관련 심층 지식 가이드</span>
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1">{relatedGuide.title}</h3>
                            </div>
                            <Link href={`/guides/${relatedGuide.slug}`} className="px-4 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shrink-0 text-center">
                                칼럼 읽기 →
                            </Link>
                        </div>
                    )}
                </div>
            )}

            <SoftLockModal
                isOpen={showSoftLock}
                onClose={() => setShowSoftLock(false)}
                type="finance"
            />
        </main>
    );
}
