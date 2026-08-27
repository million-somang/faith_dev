import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import DividendTaxCalculator from '../components/finance/DividendTaxCalculator';
import MortgageDsrCalculator from '../components/finance/MortgageDsrCalculator';
import SeveranceCalculator from '../components/finance/SeveranceCalculator';
import { SoftLockModal } from '../components/common/SoftLockModal';

export default function FinanceUtilPage() {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showSoftLock, setShowSoftLock] = useState(false);
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
