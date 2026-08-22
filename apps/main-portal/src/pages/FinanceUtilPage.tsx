import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import DividendTaxCalculator from '../components/finance/DividendTaxCalculator';
import MortgageDsrCalculator from '../components/finance/MortgageDsrCalculator';
import SeveranceCalculator from '../components/finance/SeveranceCalculator';

export default function FinanceUtilPage() {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') || 'dividend';
    
    const [activeTab, setActiveTab] = useState<'dividend' | 'dsr' | 'severance'>(
        (tabParam === 'dsr' || tabParam === 'severance') ? tabParam : 'dividend'
    );

    useEffect(() => {
        if (tabParam === 'dividend' || tabParam === 'dsr' || tabParam === 'severance') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tab: 'dividend' | 'dsr' | 'severance') => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

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
                title={currentSeo.title}
                description={currentSeo.desc}
                path={currentSeo.path}
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* 상단 네비게이션 브레드크럼 */}
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-6">
                    <Link to="/" className="hover:text-blue-600">홈</Link>
                    <span>/</span>
                    <Link to="/finance" className="hover:text-blue-600">금융</Link>
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
            </main>

            <Footer />
        </div>
    );
}
