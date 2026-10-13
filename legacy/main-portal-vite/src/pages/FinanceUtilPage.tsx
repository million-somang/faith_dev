import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import DividendTaxCalculator from '../components/finance/DividendTaxCalculator';
import MortgageDsrCalculator from '../components/finance/MortgageDsrCalculator';
import SeveranceCalculator from '../components/finance/SeveranceCalculator';
import { SoftLockModal } from '../components/common/SoftLockModal';
import { getFinanceSeoItem } from '../data/financeSeoData';
import { getGuideBySlug } from '../data/guidesData';

export default function FinanceUtilPage() {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
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

    useEffect(() => {
        setOpenFaqIndexes([0]);
    }, [activeTab]);

    const handleTabChange = (tab: 'dividend' | 'dsr' | 'severance') => {
        setActiveTab(tab);
        setSearchParams({ tab });
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

    const tabThemes: Record<'dividend' | 'dsr' | 'severance', {
        calloutBg: string;
        calloutIcon: string;
        calloutBadge: string;
        primaryColor: string;
        stepBadge: string;
    }> = {
        dividend: {
            calloutBg: 'bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 border-amber-200/80',
            calloutIcon: 'bg-amber-500',
            calloutBadge: 'text-amber-800 bg-white/80 border-amber-200',
            primaryColor: 'text-amber-600',
            stepBadge: 'bg-gradient-to-r from-amber-500 to-orange-500',
        },
        dsr: {
            calloutBg: 'bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border-blue-200/80',
            calloutIcon: 'bg-blue-600',
            calloutBadge: 'text-blue-800 bg-white/80 border-blue-200',
            primaryColor: 'text-blue-600',
            stepBadge: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        },
        severance: {
            calloutBg: 'bg-gradient-to-r from-teal-50/90 via-emerald-50/70 to-teal-50/90 border-teal-200/80',
            calloutIcon: 'bg-teal-600',
            calloutBadge: 'text-teal-800 bg-white/80 border-teal-200',
            primaryColor: 'text-teal-600',
            stepBadge: 'bg-gradient-to-r from-teal-600 to-emerald-600',
        },
    };

    const currentTheme = tabThemes[activeTab];

    const tabConfig = {
        dividend: {
            title: '미국 배당주 세금 & 월배당 계산기 | VERA 금융Util',
            desc: 'SCHD, JEPI 등 미국 배당주 배당소득세(15.4%) 공제 후 실제 월 실수령액 및 12개월 배당 캘린더, 금융소득종합과세 2000만원 한도 시뮬레이터',
            path: '/finance/util?tab=dividend',
        },
        dsr: {
            title: '주택담보대출 DSR / LTV 한도 & 상환액 계산기 | VERA 금융Util',
            desc: '내 연소득과 주택시세에 따른 2026 스트레스 DSR 2단계 최대 대출 가능액 및 원리금/원금 균등 상환 방식별 월납입금 비교',
            path: '/finance/util?tab=dsr',
        },
        severance: {
            title: '퇴직금 & 실업급여 실수령액 시뮬레이터 | VERA 금융Util',
            desc: '근속연수와 3개월 급여에 따른 법정 퇴직금 세후 실수령액 및 2026년 고용보험 실업급여(구직급여) 수급일수·총지원금 계산기',
            path: '/finance/util?tab=severance',
        },
    };

    const currentSeo = tabConfig[activeTab];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <PageSEO
                title={seoData ? seoData.title : currentSeo.title}
                description={seoData ? seoData.description : currentSeo.desc}
                path={currentSeo.path}
                tool={seoData ? {
                    name: seoData.shortTitle,
                    description: seoData.description,
                    url: `https://veranex.app${currentSeo.path}`,
                    category: 'FinanceApplication',
                    applicationCategory: 'FinanceApplication',
                    breadcrumbParent: {
                        name: '금융',
                        item: 'https://veranex.app/finance',
                    },
                    directAnswer: seoData.directAnswer,
                    howTo: {
                        name: `${seoData.shortTitle} 이용 방법`,
                        steps: seoData.howToSteps,
                    },
                    faqs: seoData.faqs,
                } : undefined}
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* 상단 네비게이션 브레드크럼 */}
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-6">
                    <Link to="/" className="hover:text-blue-600">홈</Link>
                    <span>/</span>
                    <a href="/finance" className="hover:text-blue-600">금융</a>
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

                {/* 🌟 AEO 구조화 콘텐츠 섹션 */}
                {seoData && (
                    <div className="mt-8 space-y-8 animate-fade-in">
                        {/* 1. Direct Answer 콜아웃 박스 */}
                        <section className={`${currentTheme.calloutBg} border rounded-3xl p-6 sm:p-7 shadow-sm`}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2.5 text-slate-900 font-black text-sm sm:text-base">
                                    <span className={`w-7 h-7 rounded-xl ${currentTheme.calloutIcon} text-white flex items-center justify-center text-xs shadow-xs`}>
                                        <i className="fas fa-lightbulb"></i>
                                    </span>
                                    <span>💡 AI 핵심 답변 요약 (AEO Direct Answer)</span>
                                </div>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentTheme.calloutBadge}`}>
                                    AEO 핵심 요약
                                </span>
                            </div>
                            <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed sm:pl-9">
                                {seoData.directAnswer}
                            </p>
                        </section>

                        {/* 2. 계산 공식 & 법정 산식 카드 */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                                    <i className="fas fa-square-root-alt"></i>
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    {seoData.formula.title}
                                </h2>
                            </div>

                            <div className="bg-slate-950 text-emerald-400 font-mono text-sm sm:text-base p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto mb-4">
                                <span className="text-xs text-slate-400 block mb-1 font-sans">📌 표준 법정 산정식</span>
                                <code>{seoData.formula.expression}</code>
                            </div>

                            <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                                {seoData.formula.description}
                            </p>

                            {seoData.formula.variables.length > 0 && (
                                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                                <th className="py-3 px-4 w-1/3">산정 기준 변수</th>
                                                <th className="py-3 px-4">세부 기준 및 적용 방법</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {seoData.formula.variables.map((v, i) => (
                                                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/40">
                                                        {v.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 leading-relaxed">
                                                        {v.description}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        {/* 3. 실제 계산 시뮬레이션 사례 */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                                    <i className="fas fa-calculator"></i>
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    실제 계산 시뮬레이션 사례
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                        📋 기준 시나리오
                                    </span>
                                    <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed">
                                        {seoData.example.scenario}
                                    </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                        🔢 산출 과정
                                    </span>
                                    <p className="text-slate-700 text-sm leading-relaxed font-mono whitespace-pre-line">
                                        {seoData.example.calculation}
                                    </p>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                                        ✅ 최종 산출 결과
                                    </span>
                                    <p className="text-emerald-950 text-base sm:text-lg font-bold leading-relaxed">
                                        {seoData.example.result}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 4. 3단계 간편 이용 가이드 */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                                    <i className="fas fa-list-ol"></i>
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    3단계 간편 이용 가이드
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {seoData.howToSteps.map((step, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-50 rounded-2xl p-5 border border-slate-200/70 flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className={`w-8 h-8 rounded-xl ${currentTheme.stepBadge} text-white font-black text-sm flex items-center justify-center mb-3 shadow-xs`}>
                                                {idx + 1}
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                                {step.name}
                                            </h3>
                                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                                                {step.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 5. 자주 묻는 질문 FAQ */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                                    <i className="fas fa-question-circle"></i>
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    자주 묻는 질문 (FAQ)
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {seoData.faqs.map((faq, idx) => {
                                    const isOpen = openFaqIndexes.includes(idx);
                                    return (
                                        <div
                                            key={idx}
                                            className="border border-slate-200/80 rounded-2xl overflow-hidden transition-colors"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleFaq(idx)}
                                                className="w-full text-left px-5 py-4 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 transition-colors cursor-pointer"
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span className={`${currentTheme.primaryColor} font-black text-sm`}>Q.</span>
                                                    <span>{faq.question}</span>
                                                </span>
                                                <i className={`fas fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isOpen ? `rotate-180 ${currentTheme.primaryColor}` : ''}`}></i>
                                            </button>
                                            {isOpen && (
                                                <div className="px-5 py-4 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                                                    <div className="flex gap-3">
                                                        <span className="text-emerald-600 font-black text-sm flex-shrink-0">A.</span>
                                                        <p>{faq.answer}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 6. 연관 지식 가이드 추천 카드 */}
                        {seoData.relatedGuideSlug && (
                            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
                                    <div className="space-y-1.5">
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                                            <i className="fas fa-book-open"></i> VERA 금융 리서치 심층 칼럼
                                        </span>
                                        <h3 className="text-base sm:text-lg font-bold text-white">
                                            {relatedGuide ? relatedGuide.title : `${seoData.shortTitle} 심층 분석 가이드`}
                                        </h3>
                                        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                                            {relatedGuide ? relatedGuide.description : '전문 애널리스트가 정리한 최신 금융 전략과 실제 사례를 확인해 보세요.'}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/guides/${seoData.relatedGuideSlug}`}
                                        className="px-5 py-3 bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-2"
                                    >
                                        <span>VERA 금융 편집국 심층 분석 칼럼 함께 읽기</span>
                                        <i className="fas fa-arrow-right text-[11px]"></i>
                                    </Link>
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* 🌟 소프트 락인 넛지 배너 */}
                <div className="mt-12 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
                    <div className="space-y-1.5 text-center sm:text-left">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                            <i className="fas fa-bookmark"></i> 스마트 포트폴리오
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold">
                            방금 계산한 금융 시뮬레이션 결과를 저장할까요?
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                            {user ? '계산된 포트폴리오는 마이페이지 자산 탭에서 실시간 배당일정과 함께 보관됩니다.' : '로그인하시면 나만의 배당주 포트폴리오와 대출 상환 계획표가 영구 저장되며 실시간 알림을 받아보실 수 있습니다.'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (!user) {
                                setShowSoftLock(true);
                            } else {
                                window.location.href = '/mypage';
                            }
                        }}
                        className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-2"
                    >
                        <i className="fas fa-save"></i>
                        <span>{user ? '마이페이지에서 확인' : '관심 포트폴리오 저장하기'}</span>
                    </button>
                </div>
            </main>

            <Footer />

            {/* 🌟 소프트 락인 모달 */}
            <SoftLockModal
                isOpen={showSoftLock}
                onClose={() => setShowSoftLock(false)}
                type="finance"
            />
        </div>
    );
}
