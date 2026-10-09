import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { GUIDES_DATA } from '../data/guidesData';

const FINANCE_GUIDE_SLUGS = [
    '2026-global-interest-rate-dividend-strategy',
    'foreign-exchange-rate-and-macro-investment',
    'magic-of-compound-interest-and-dollar-cost-averaging',
    'compound-interest-calculator-guide-and-wealth-building',
    'sp500-index-fund-dollar-investing-principles',
];

const FINANCE_FAQS = [
    {
        q: '미국 배당주 수령 시 세금(배당소득세)은 어떻게 부과되며 금융소득종합과세 기준은 무엇인가요?',
        a: '미국 주식 배당금은 한미 조세조약에 따라 미국 현지에서 15%가 원천징수되며, 국내 기본 배당소득세율(15.4%)과 조율되어 15.4% 분리과세로 종결됩니다. 단, 연간 이자 및 배당소득 합계가 2,000만 원을 초과하면 초과분이 아닌 전체 금융소득이 타 종합소득과 합산되어 6%~45% 누진세율이 적용되고 건강보험료 피부양자 자격이 상실됩니다.'
    },
    {
        q: '2026년 스트레스 DSR 2단계가 주택담보대출 한도에 미치는 영향은 무엇인가요?',
        a: '스트레스 DSR 2단계는 향후 금리 인상 위험을 심사에 반영하여 수도권 주택담보대출에 +1.20%p, 비수도권에 +0.75%p의 스트레스 가산금리를 적용합니다. 제1금융권 DSR 40% 한도 내에서 상환 능력이 엄격하게 재산정되어, 동일 연봉 기준 대출 한도가 기존 대비 약 8%~15% 축소됩니다.'
    },
    {
        q: '실시간 환율 조회와 은행별 환전 수수료 우대(Spread)는 어떻게 활용하나요?',
        a: '매매기준율은 기준 가격이며, 실제 현찰을 살 때나 해외 송금 시에는 은행별 환전 수수료율(스프레드 약 1.5%~1.75%)이 가산됩니다. 주요 은행의 모바일 환전 우대율(최대 90% 우대)을 적용받으면 매매기준율에 근접한 유리한 환율로 달러(USD)나 엔화(JPY)를 환전할 수 있습니다.'
    },
    {
        q: '단리 상품과 복리 적금의 수익률 차이와 적금 풍차돌리기 전략은 무엇인가요?',
        a: '단리는 최초 원금에만 이자가 붙지만, 복리는 매월 발생한 이자가 원금에 합산되어 재투자되므로 기간이 길어질수록 수익 격차가 기하급수적으로 커집니다. 매월 1년 만기 정기적금을 새로 개설하는 \'적금 풍차돌리기\'를 활용하면 유동성을 확보하면서도 복리 효과와 이자소득세(15.4%) 절감 혜택을 극대화할 수 있습니다.'
    }
];

export default function FinancePage() {
    const { user, logout } = useAuth();
    const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);

    const toggleFaq = (index: number) => {
        setOpenFaqIndexes(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const financeGuides = GUIDES_DATA.filter(g => FINANCE_GUIDE_SLUGS.includes(g.slug));

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <Header user={user} onLogout={logout} />
            
            <PageSEO
                title="글로벌 금융 시장 & 자산 관리 센터 | VERA"
                description="국내외 증시 지수(KOSPI, S&P500, NASDAQ), 실시간 환율, 미국 배당주 세금 계산기, 주택담보대출 DSR 계산기를 한눈에 확인하세요."
                path="/finance"
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'FinancialService',
                            name: '글로벌 금융 시장 & 자산 관리 센터 | VERA',
                            description: '국내외 증시 지수(KOSPI, S&P500, NASDAQ), 실시간 환율, 미국 배당주 세금 계산기, 주택담보대출 DSR 계산기를 한눈에 확인하세요.',
                            url: 'https://veranex.app/finance',
                            provider: {
                                '@type': 'Organization',
                                name: 'VERA',
                                url: 'https://veranex.app'
                            }
                        },
                        {
                            '@type': 'BreadcrumbList',
                            itemListElement: [
                                {
                                    '@type': 'ListItem',
                                    position: 1,
                                    name: '홈',
                                    item: 'https://veranex.app/'
                                },
                                {
                                    '@type': 'ListItem',
                                    position: 2,
                                    name: '금융',
                                    item: 'https://veranex.app/finance'
                                }
                            ]
                        },
                        {
                            '@type': 'FAQPage',
                            mainEntity: FINANCE_FAQS.map(faq => ({
                                '@type': 'Question',
                                name: faq.q,
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: faq.a
                                }
                            }))
                        }
                    ]
                }}
            />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full space-y-8">
                {/* 1. 상단 브레드크럼 */}
                <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Link to="/" className="hover:text-slate-800 transition-colors">홈</Link>
                    <span>/</span>
                    <span className="text-slate-800 font-bold">금융</span>
                </nav>

                {/* 2. 히어로 헤더 */}
                <header className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            🏛️ VERA 금융 인텔리전스 허브
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                            <i className="fas fa-shield-alt text-emerald-600"></i>
                            <span>2026 최신 세법 및 금융 규제 반영</span>
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                        글로벌 금융 시장 & 자산 관리 센터
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl">
                        국내외 주요 증시 지표와 실시간 환율 정보, 2026 개정 세법 및 스트레스 DSR 대출 규제를 반영한 AEO 금융 계산기, 그리고 전문 투자 리서치 칼럼을 한곳에서 제공합니다.
                    </p>
                </header>

                {/* 3. AEO 금융 계산기 및 유틸리티 바로가기 배너 */}
                <section className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-6 sm:p-8 rounded-3xl border border-blue-200/80 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-extrabold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                                AEO 스마트 금융 계산기 허브
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                                💡 VERA 금융 계산기 & 모의 시뮬레이터
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            <Link
                                to="/finance/util"
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                            >
                                <span>VERA 금융Util 센터 전체보기</span>
                                <span>→</span>
                            </Link>
                            <Link
                                to="/tools/finance-dsr"
                                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                            >
                                <span>2026 스트레스 DSR 단독 계산기</span>
                                <span>→</span>
                            </Link>
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                        미국 배당주 원천징수 세금(15%) 및 월배당 캘린더, 2026 스트레스 DSR 2단계 대출 한도 규제, 법정 퇴직금 및 IRP 30% 감면 계산기를 별도 가입 없이 100% 무료로 이용하실 수 있습니다.
                    </p>

                    {/* 3대 핵심 계산기 바로가기 탭 카드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <Link
                            to="/finance/util?tab=dividend"
                            className="p-4 rounded-2xl bg-white/90 border border-blue-200/60 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">배당소득세</span>
                                <h3 className="font-bold text-slate-900 text-sm mt-2 mb-1 group-hover:text-blue-600 transition-colors">
                                    💰 미국 배당주 세금 계산기
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    15% 원천징수 세율, 2,000만 원 금융소득종합과세, 건보료 피부양자 탈락 요건 시뮬레이션
                                </p>
                            </div>
                            <div className="mt-3 text-xs font-bold text-blue-600 flex items-center justify-between">
                                <span>계산하기</span>
                                <span>→</span>
                            </div>
                        </Link>

                        <Link
                            to="/finance/util?tab=dsr"
                            className="p-4 rounded-2xl bg-white/90 border border-indigo-200/60 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">스트레스 DSR</span>
                                <h3 className="font-bold text-slate-900 text-sm mt-2 mb-1 group-hover:text-indigo-600 transition-colors">
                                    🏠 2026 주택담보대출 한도
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    수도권 +1.20%p / 비수도권 +0.75%p 가산금리 및 DSR 40% 한도 정밀 산정
                                </p>
                            </div>
                            <div className="mt-3 text-xs font-bold text-indigo-600 flex items-center justify-between">
                                <span>계산하기</span>
                                <span>→</span>
                            </div>
                        </Link>

                        <Link
                            to="/finance/util?tab=severance"
                            className="p-4 rounded-2xl bg-white/90 border border-emerald-200/60 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">퇴직금 & IRP</span>
                                <h3 className="font-bold text-slate-900 text-sm mt-2 mb-1 group-hover:text-emerald-600 transition-colors">
                                    💼 법정 퇴직금 및 IRP 절세
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    1일 평균임금 산정식, 2026 근속연수공제 개정안, IRP 30~40% 세액 감면 혜택
                                </p>
                            </div>
                            <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center justify-between">
                                <span>계산하기</span>
                                <span>→</span>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* 4. 4대 글로벌 자산 관리 핵심 원리 */}
                <section className="space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <span>📊 자산 관리 & 거시 금융 핵심 원리</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span>💵 글로벌 환율 및 통화 흐름</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                미국 달러(USD), 일본 엔(JPY), 유럽 유로(EUR), 중국 위안(CNY) 등 주요 기축통화의 매매기준율과 환전 수수료율(Spread)을 비교 분석하여 해외 결제 및 달러 자산 배분을 돕습니다.
                            </p>
                        </div>
                        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span>📉 대출 상환 방식 완벽 비교</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                원리금균등분할상환 vs 원금균등분할상환 vs 만기일시상환 방식에 따른 매월 상환 부담금과 대출 기간 전체의 총 이자 발생액을 시뮬레이션하여 최적의 금융 설계를 제안합니다.
                            </p>
                        </div>
                        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span>📈 복리 효과 & 예적금 풍차돌리기</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                단리와 복리의 누적 수익 격차를 파악하고, 매월 1년 만기 적금을 새로 개설하여 유동성과 복리 이자 효과를 동시에 누리는 풍차돌리기 전략과 이자소득세(15.4%) 절세법을 소개합니다.
                            </p>
                        </div>
                        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span>🏛️ 미국 배당주 & 지수 ETF 장기 투자</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                S&P 500 및 나스닥 100 지수를 추종하는 대표 패시브 ETF와 25년 이상 배당을 증액해 온 미국 배당 귀족주 포트폴리오를 통해 지속 가능한 은퇴 현금 파이프라인 구축을 안내합니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 5. 5대 심층 금융 리서치 가이드 칼럼 링크 */}
                <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div>
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">E-E-A-T EXPERT RESEARCH</span>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                                <i className="fas fa-book-open text-emerald-600"></i>
                                <span>📚 VERA 금융 추천 지식 칼럼 (5대 심층 리서치)</span>
                            </h2>
                        </div>
                        <Link to="/guides" className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                            <span>칼럼 전체보기</span>
                            <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {financeGuides.map(guide => (
                            <Link
                                key={guide.slug}
                                to={`/guides/${guide.slug}`}
                                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            {guide.category}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {guide.readTime}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors mb-2 line-clamp-2">
                                        {guide.title}
                                    </h3>
                                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                        {guide.summary}
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                                    <span>칼럼 읽기</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 6. 자주 묻는 질문 (FAQ) 아코디언 */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            <i className="fas fa-question"></i>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                            자주 묻는 질문 (FAQ)
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {FINANCE_FAQS.map((faq, idx) => {
                            const isOpen = openFaqIndexes.includes(idx);
                            return (
                                <div
                                    key={idx}
                                    className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-900 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-3 transition-colors"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                                                Q
                                            </span>
                                            <span>{faq.q}</span>
                                        </span>
                                        <i className={`fas fa-chevron-down text-slate-400 text-xs shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}></i>
                                    </button>
                                    {isOpen && (
                                        <div className="p-4 sm:p-5 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                                            <p className="pl-7">{faq.a}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
