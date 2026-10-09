import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { getToolBySlug, TOOLS_DATA, ToolDetailItem } from '../data/toolsData';
import MortgageDsrCalculator from '../components/finance/MortgageDsrCalculator';

export default function ToolDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { user, logout } = useAuth();
    const [iframeRefreshKey, setIframeRefreshKey] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0, 1]);

    const tool = slug ? getToolBySlug(slug) : undefined;

    // 환경에 따른 실제 mini-app 호스트 URL 계산
    const resolveAppUrl = (rawUrl: string): string => {
        let baseUrl = rawUrl;
        if (import.meta.env.DEV) {
            if (rawUrl.includes('calculator')) baseUrl = 'http://localhost:5019/app/calculator/';
            else if (rawUrl.includes('text-checker')) baseUrl = 'http://localhost:5011/app/text-checker/';
            else if (rawUrl.includes('pyeong-calc')) baseUrl = 'http://localhost:5014/app/pyeong-calc/';
            else if (rawUrl.includes('age-calc')) baseUrl = 'http://localhost:5017/app/age-calc/';
            else if (rawUrl.includes('dday-calc')) baseUrl = 'http://localhost:5018/app/dday-calc/';
            else if (rawUrl.includes('severance-calc')) baseUrl = 'http://localhost:5028/app/severance-calc/';
            else if (rawUrl.includes('interest-calc')) baseUrl = 'http://localhost:5029/app/interest-calc/';
            else if (rawUrl.includes('customs-calc')) baseUrl = 'http://localhost:5035/app/customs-calc/';
            else if (rawUrl.includes('ocr')) baseUrl = 'http://localhost:5036/app/ocr/';
            else if (rawUrl.includes('vacation-planner')) baseUrl = 'http://localhost:5039/app/vacation-planner/';
            else if (rawUrl.includes('base64-converter')) baseUrl = 'http://localhost:5037/app/base64-converter/';
            else if (rawUrl.includes('svg-converter')) baseUrl = 'http://localhost:5038/app/svg-converter/';
        }
        return baseUrl;
    };

    // 관련 도구 추천 (동일 카테고리 우선 또는 다른 도구 4개)
    const relatedTools = useMemo<ToolDetailItem[]>(() => {
        if (!tool) return [];
        const sameCategory = TOOLS_DATA.filter(t => t.slug !== tool.slug && t.category === tool.category);
        const others = TOOLS_DATA.filter(t => t.slug !== tool.slug && t.category !== tool.category);
        return [...sameCategory, ...others].slice(0, 4);
    }, [tool]);

    // FAQ 아코디언 토글
    const toggleFaq = (index: number) => {
        setOpenFaqIndexes(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    // 링크 복사
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 404 폴백 렌더링
    if (!tool) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <Header user={user} onLogout={logout} />
                <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                        <i className="fas fa-tools"></i>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">요청하신 도구를 찾을 수 없습니다</h2>
                    <p className="text-slate-500 text-sm mb-6">존재하지 않거나 주소가 변경된 생활 금융 도구입니다.</p>
                    <Link
                        to="/lifestyle"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-sm"
                    >
                        <i className="fas fa-arrow-left"></i>
                        <span>생활도구 목록으로 이동</span>
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    const resolvedUrl = resolveAppUrl(tool.appUrl);
    const isInternalFinanceDsr = tool.slug === 'finance-dsr';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Page SEO & AEO Structured Data */}
            <PageSEO
                title={tool.title}
                description={tool.description}
                path={`/tools/${tool.slug}`}
                tool={{
                    name: tool.name,
                    description: tool.description,
                    url: `https://veranex.app/tools/${tool.slug}`,
                    category: tool.categoryLabel,
                    directAnswer: tool.directAnswer,
                    howTo: {
                        name: `${tool.name} 이용 가이드`,
                        steps: tool.howToSteps,
                    },
                    faqs: tool.faqs,
                }}
            />

            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
                {/* 1. 상단 브레드크럼 & 빠른 이동 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 overflow-x-auto whitespace-nowrap">
                        <Link to="/" className="hover:text-slate-700 transition-colors">홈</Link>
                        <i className="fas fa-chevron-right text-[10px]"></i>
                        <Link to="/lifestyle" className="hover:text-slate-700 transition-colors">생활도구</Link>
                        <i className="fas fa-chevron-right text-[10px]"></i>
                        <span className="text-slate-700">{tool.name}</span>
                    </nav>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
                            title="현재 페이지 주소 복사"
                        >
                            <i className={copied ? 'fas fa-check text-emerald-600' : 'fas fa-link text-slate-400'}></i>
                            <span>{copied ? '복사 완료!' : '공유하기'}</span>
                        </button>
                        <Link
                            to="/lifestyle"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                            <i className="fas fa-th-large"></i>
                            <span>전체 도구 보기</span>
                        </Link>
                    </div>
                </div>

                {/* 2. 히어로 헤더 & 단일 H1 (AEO / SEO 최적화) */}
                <header className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tool.iconBg} ${tool.iconColor} border border-slate-200/60`}>
                            <i className={tool.icon}></i>
                            <span>{tool.categoryLabel}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
                            <i className="fas fa-check-circle text-emerald-600"></i>
                            <span>2026 최신 법정 산식 검증</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <i className="fas fa-bolt text-amber-500"></i>
                            <span>설치 없이 즉시 실행</span>
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug mb-3">
                        {tool.title}
                    </h1>

                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl mb-4 font-normal">
                        {tool.description}
                    </p>

                    {/* 키워드 태그 목록 */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
                        {tool.keywords.map(kw => (
                            <span
                                key={kw}
                                className="text-[11px] font-medium bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60"
                            >
                                #{kw}
                            </span>
                        ))}
                    </div>
                </header>

                {/* 3. AEO 핵심 요약 박스 (AI Direct Answer Box) */}
                <section className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200/80 rounded-3xl p-6 sm:p-7 shadow-sm mb-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-blue-900 font-black text-sm sm:text-base">
                            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs">
                                <i className="fas fa-lightbulb"></i>
                            </span>
                            <span>핵심 요약 (AI Direct Answer)</span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                            AEO 검색 요약
                        </span>
                    </div>
                    <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed pl-9">
                        {tool.directAnswer}
                    </p>
                </section>

                {/* 4. 인라인 인터랙티브 도구 실행 창 (Embedded Tool Container) */}
                <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
                    {/* 도구 툴바 헤더 */}
                    <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white text-xs border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="font-bold tracking-wide">{tool.name}</span>
                            <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">| 실시간 브라우저 실행</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIframeRefreshKey(k => k + 1)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
                                title="도구 새로고침"
                            >
                                <i className="fas fa-redo-alt text-[10px]"></i>
                                <span className="hidden sm:inline">새로고침</span>
                            </button>
                            <button
                                onClick={() => setIsFullscreen(f => !f)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
                                title={isFullscreen ? '창 크기 복원' : '화면 최대화'}
                            >
                                <i className={isFullscreen ? 'fas fa-compress text-[10px]' : 'fas fa-expand text-[10px]'}></i>
                                <span className="hidden sm:inline">{isFullscreen ? '축소' : '최대화'}</span>
                            </button>
                            <a
                                href={resolvedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1 font-semibold"
                                title="독립 창에서 열기"
                            >
                                <i className="fas fa-external-link-alt text-[10px]"></i>
                                <span>새 창으로 열기</span>
                            </a>
                        </div>
                    </div>

                    {/* 안내 프롬프트 배너 (Finance Util 전용) */}
                    {isInternalFinanceDsr && (
                        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-info-circle text-amber-600"></i>
                                <span>주택담보대출 계산기는 VERA 금융 계산기 허브(배당세·퇴직금)에서도 함께 비교하실 수 있습니다.</span>
                            </div>
                            <Link
                                to="/finance/util?tab=dsr"
                                className="font-bold text-amber-800 hover:underline inline-flex items-center gap-1"
                            >
                                <span>금융 Util 전용관 가기</span>
                                <i className="fas fa-chevron-right text-[10px]"></i>
                            </Link>
                        </div>
                    )}

                    {/* 임베드 실행 뷰포트 */}
                    <div className={`w-full transition-all duration-200 ${isFullscreen ? 'min-h-[85vh] h-[85vh]' : 'min-h-[580px] h-[640px] sm:h-[720px]'}`}>
                        {isInternalFinanceDsr ? (
                            <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-50">
                                <MortgageDsrCalculator />
                            </div>
                        ) : (
                            <iframe
                                key={iframeRefreshKey}
                                src={resolvedUrl}
                                title={tool.name}
                                className="w-full h-full border-0 bg-white"
                                allow="clipboard-read; clipboard-write; microphone; camera"
                                loading="eager"
                            />
                        )}
                    </div>
                </section>

                {/* 5. 계산 공식 & 법정 산식 (Formula Card) */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                            <i className="fas fa-square-root-alt"></i>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                            {tool.formula.title}
                        </h2>
                    </div>

                    {/* 주요 산식 수식 블록 */}
                    <div className="bg-slate-950 text-emerald-400 font-mono text-sm sm:text-base p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto mb-4">
                        <span className="text-xs text-slate-400 block mb-1 font-sans">📌 표준 법정 산정식</span>
                        <code>{tool.formula.expression}</code>
                    </div>

                    <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                        {tool.formula.explanation}
                    </p>

                    {/* 산식 변수 상세 설명 표 */}
                    {tool.formula.variables.length > 0 && (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                        <th className="py-3 px-4 w-1/3">산정 기준 변수</th>
                                        <th className="py-3 px-4">세부 기준 및 적용 방법</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tool.formula.variables.map((v, i) => (
                                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/40">
                                                {v.name}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 leading-relaxed">
                                                {v.desc}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* 6. 실제 계산 시뮬레이션 사례 (Example Case Card) */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
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
                                {tool.example.scenario}
                            </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                🔢 산출 과정
                            </span>
                            <p className="text-slate-700 text-sm leading-relaxed font-mono">
                                {tool.example.calculation}
                            </p>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                                ✅ 최종 산출 결과
                            </span>
                            <p className="text-emerald-950 text-base sm:text-lg font-bold leading-relaxed">
                                {tool.example.result}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 7. 단계별 사용 가이드 (How-To 3 Steps) */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                            <i className="fas fa-list-ol"></i>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                            3단계 간편 사용 가이드
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tool.howToSteps.map((step, idx) => (
                            <div
                                key={idx}
                                className="bg-slate-50 rounded-2xl p-5 border border-slate-200/70 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-3 shadow-xs">
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

                {/* 8. 자주 묻는 질문 (FAQ Accordion) */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                            <i className="fas fa-question-circle"></i>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                            자주 묻는 질문 (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {tool.faqs.map((faq, idx) => {
                            const isOpen = openFaqIndexes.includes(idx);
                            return (
                                <div
                                    key={idx}
                                    className="border border-slate-200/80 rounded-2xl overflow-hidden transition-colors"
                                >
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full text-left px-5 py-4 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 transition-colors"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="text-blue-600 font-black text-sm">Q.</span>
                                            <span>{faq.question}</span>
                                        </span>
                                        <i className={`fas fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}></i>
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

                {/* 9. 관련 유용한 도구 추천 */}
                {relatedTools.length > 0 && (
                    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                                    <i className="fas fa-layer-group"></i>
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    관련 추천 생활 & 금융 도구
                                </h2>
                            </div>
                            <Link
                                to="/lifestyle"
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                                <span>전체 13개 도구</span>
                                <i className="fas fa-chevron-right text-[10px]"></i>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {relatedTools.map(rTool => (
                                <Link
                                    key={rTool.slug}
                                    to={`/tools/${rTool.slug}`}
                                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-xl ${rTool.iconBg} ${rTool.iconColor} flex items-center justify-center text-lg shadow-2xs`}>
                                                <i className={rTool.icon}></i>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {rTool.categoryLabel}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                                            {rTool.name}
                                        </h3>
                                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                            {rTool.directAnswer}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-600">
                                        <span>도구 실행하기</span>
                                        <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
}
