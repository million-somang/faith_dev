import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

export default function EditorialPolicyPage() {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <PageSEO
                title="편집 및 팩트체크 정책 (Editorial Policy) - VERA"
                description="VERA 포털의 콘텐츠 제작 원칙, 사실 확인(Fact-Checking) 기준, 전문성 및 신뢰성(E-E-A-T) 검수 가이드라인입니다."
                path="/editorial-policy"
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold mb-4 border border-teal-200">
                        <i className="fas fa-shield-check"></i> E-E-A-T STANDARDS & EDITORIAL POLICY
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
                        편집 및 팩트체크 정책 (Editorial Policy)
                    </h1>
                    <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
                        최종 개정일: 2026년 8월 20일 · VERA 콘텐츠 편집국
                    </p>

                    <div className="prose prose-slate max-w-none text-slate-700 space-y-8 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-teal-600 rounded-full inline-block"></span>
                                1. 콘텐츠 제작 및 윤리 원칙
                            </h2>
                            <p>
                                VERA(베라)는 독자에게 실질적이고 유용한 지식을 전달하기 위해 모든 콘텐츠를 직접 조사·분석하여 독창적으로 집필합니다.
                                타인의 저작물을 단순 복제, 스크랩, 요약하는 행위를 엄격히 금지하며, 독자적인 시각과 깊이 있는 실무 해설을 담은 오리지널 콘텐츠만을 발행합니다.
                            </p>
                        </section>

                        <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-teal-600 rounded-full inline-block"></span>
                                2. 사실 확인(Fact-Checking) 및 출처 검증 절차
                            </h2>
                            <p className="mb-4">
                                특히 금융, 세무, 법률, 주거 청약 등 독자의 일상과 재산에 직결되는 분야(YMYL)의 칼럼은 다음과 같은 공인 1차 자료(Primary Sources)만을 근거로 교차 검증합니다:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                                <li><strong>금융 및 거시경제:</strong> 한국은행(BOK), 금융위원회, 미국 연방준비제도(Fed), 금융감독원 전자공시시스템(DART)</li>
                                <li><strong>법률 및 행정 제도:</strong> 법제처 국가법령정보센터, 국세청 홈택스 공식 세정 자료</li>
                                <li><strong>부동산 및 청약:</strong> 국토교통부, 한국부동산원 청약홈 공식 고시 기준</li>
                                <li><strong>컴퓨터 공학 및 표준:</strong> W3C 웹 표준 규격, IETF RFC 문서, ECMA 국제 표준</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-teal-600 rounded-full inline-block"></span>
                                3. 전문 연구팀 구성 및 감수 체계
                            </h2>
                            <p>
                                VERA의 모든 지식 가이드는 분야별 전담 연구팀(금융 리서치팀, 명리인문학 연구소, 테크 아키텍처팀, 두뇌전략 연구소)이 초안을 작성하고,
                                공인 시니어 에디터가 내용의 정확성, 논리적 정합성, 가독성, 최신 개정 법령 반영 여부를 최종 검수한 후 발행합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-teal-600 rounded-full inline-block"></span>
                                4. 인공지능(AI) 도구 활용에 관한 원칙
                            </h2>
                            <p>
                                VERA는 데이터 수집 보조 및 교정 단계에서 최신 언어 모델 도구를 제한적으로 활용할 수 있으나,
                                기획, 사실 확인, 분석 논리 수립, 최종 발행 승인은 100% 인간 전문가의 책임 하에 엄격히 통제됩니다.
                                AI에 의한 무분별한 자동 생성 콘텐츠(Automated Content)는 일체 게재하지 않습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-teal-600 rounded-full inline-block"></span>
                                5. 수정 및 정정 보도(Corrections) 정책
                            </h2>
                            <p>
                                법률 개정이나 시장 상황의 급변으로 인해 기존 아티클의 내용 수정이 필요한 경우, 지체 없이 본문을 업데이트하고 상단에 '최종 검수일(Updated Date)'을 명시합니다.
                                사실관계 오류에 대한 독자 제보는 24시간 상시 접수하며, 검토 즉시 투명하게 정정 반영합니다.
                            </p>
                            <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 mt-3 text-xs text-teal-900">
                                <p><strong>오류 제보 및 편집국 문의:</strong> editorial@veranex.app / contact@veranex.app</p>
                                <p><strong>응대 시간:</strong> 평일 09:00 ~ 18:00 (영업일 기준 24시간 이내 검토 및 회신)</p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
