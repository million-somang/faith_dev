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

function FinanceUtilContent() {
    const searchParams = useSearchParams();
    const [showSoftLock, setShowSoftLock] = useState(false);
    const tabParam = searchParams.get('tab') || 'dividend';
    
    const [activeTab, setActiveTab] = useState<'dividend' | 'dsr' | 'severance'>(
        (tabParam === 'dsr' || tabParam === 'severance') ? tabParam : 'dividend'
    );
    const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);

    useEffect(() => {
        if (tabParam === 'dividend' || tabParam === 'dsr' || tabParam === 'severance') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tab: 'dividend' | 'dsr' | 'severance') => {
        setActiveTab(tab);
    };

    const toggleFaq = (index: number) => {
        setOpenFaqIndexes(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const tabKeyMap: Record<'dividend' | 'dsr' | 'severance', string> = {
        dividend: 'dividend-tax',
        dsr: 'mortgage-dsr',
        severance: 'severance-irp',
    };

    const seoData = getFinanceSeoItem(tabKeyMap[activeTab]);
    const relatedGuide = seoData ? getGuideBySlug(seoData.relatedGuideSlug) : undefined;

    return (
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-8 sm:py-12 space-y-8">
            {/* 상단 네비게이션 브레드크럼 */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-2">
                <Link href="/" className="hover:text-blue-600">홈</Link>
                <span>/</span>
                <Link href="/finance" className="hover:text-blue-600">금융</Link>
                <span>/</span>
                <span className="text-amber-700 font-black">금융Util</span>
            </div>

            {/* 대형 탭 메뉴 */}
            <div className="flex flex-wrap gap-2 sm:gap-3 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm mb-8">
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

            {/* AEO 구조화 콘텐츠 섹션 */}
            {seoData && (
                <div className="mt-8 space-y-8 animate-fade-in">
                    <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
                        <div className="flex items-center gap-2.5 text-slate-900 font-black text-sm sm:text-base mb-3">
                            <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs">
                                <i className="fas fa-lightbulb"></i>
                            </span>
                            <span>핵심 요약 (Direct Answer)</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {seoData.directAnswer}
                        </p>
                    </section>

                    {relatedGuide && (
                        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-xs text-teal-600 font-bold">관련 지식 가이드</span>
                                <h4 className="font-bold text-slate-900 text-sm mt-1">{relatedGuide.title}</h4>
                            </div>
                            <Link href={`/guides/${relatedGuide.slug}`} className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors">
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

export default function FinanceUtilPage() {
    return (
        <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-slate-400">금융 계산기 불러오는 중...</div>}>
            <FinanceUtilContent />
        </Suspense>
    );
}
