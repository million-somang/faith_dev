import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../hooks/useAuth';
import FinanceSubMenu from '../components/FinanceSubMenu';
import DividendTaxCalculator from '../components/finance/DividendTaxCalculator';
import MortgageDsrCalculator from '../components/finance/MortgageDsrCalculator';
import SeveranceCalculator from '../components/finance/SeveranceCalculator';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header baseUrl={MAIN_PORTAL_URL} user={user} onLogout={logout} />
            <FinanceSubMenu />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                {/* 상단 네비게이션 브레드크럼 */}
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-6">
                    <a href={MAIN_PORTAL_URL || '/'} className="hover:text-blue-600">홈</a>
                    <span>/</span>
                    <Link to="/" className="hover:text-blue-600">금융</Link>
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
