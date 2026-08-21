import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { useAppLauncher } from '../hooks/useAppLauncher';
import { PageSEO } from '../components/PageSEO';
import EntertainmentSubMenu from '../components/EntertainmentSubMenu';

export default function SajuInfoPage() {
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const { launchApp } = useAppLauncher();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pillars' | 'elements' | 'faq'>('pillars');

    // 로그인 가드
    useEffect(() => {
        if (!isAuthLoading && !user) {
            alert('사주 풀이 서비스는 로그인 후 이용하실 수 있습니다. 로그인 페이지로 이동합니다.');
            navigate('/login?redirect=/entertainment/saju');
        }
    }, [user, isAuthLoading, navigate]);

    const handleStartSaju = () => {
        if (!user) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login?redirect=/entertainment/saju');
            return;
        }
        launchApp('/app/saju/', 'app-saju');
    };

    const handleShare = () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: '베라 만세력 & 사주 풀이 - 내 사주와 오행의 조화',
                url: shareUrl,
            }).catch(err => console.error(err));
        } else {
            navigator.clipboard.writeText(shareUrl)
                .then(() => alert('사주 서비스 주소가 복사되었습니다.'))
                .catch(() => alert('주소창의 URL을 복사해 주세요.'));
        }
    };

    const faqItems = [
        {
            q: '태어난 시간을 정확히 모르면 어떻게 하나요?',
            a: '태어난 시간을 모르실 경우 "시간 모름"을 선택하시면 됩니다. 사주에서 가장 중요한 일주(나 자신)와 년주, 월주의 6글자를 정밀 분석하여 신뢰도 높은 오행 분포와 성향 풀이를 제공합니다.'
        },
        {
            q: '오행(목·화·토·금·수) 밸런스는 어떤 의미를 갖나요?',
            a: '사람은 저마다 타고난 기운의 비율이 다릅니다. 어떤 오행이 많고 부족한지 파악하면, 나에게 부족한 기운을 채워주는 색상, 식습관, 공간, 직업 환경을 선택하여 삶의 균형을 맞추는 데 큰 도움이 됩니다.'
        },
        {
            q: '2인 사주 궁합은 어떤 방식으로 풀이되나요?',
            a: '단순히 띠로만 비교하는 방식에서 벗어나, 두 사람의 오행 상호 보완도, 일간(日干)의 합과 충, 그리고 성향 차이를 입체적으로 분석하여 서로를 더 깊이 이해할 수 있는 실질적인 관계 조언을 드립니다.'
        },
        {
            q: '입력한 생년월일 정보가 서버에 저장되나요?',
            a: '아닙니다. 입력하신 모든 정보는 이용자의 브라우저 내에서 1회성으로 연산된 후 즉시 소멸되며, 데이터베이스에 저장되지 않아 안심하고 이용하실 수 있습니다.'
        },
        {
            q: '사주에서 나오는 재물운과 직업운은 어떻게 활용하나요?',
            a: '타고난 사주 원국의 식상(표현·창의), 재성(결과·자산), 관성(조직·명예), 인성(지혜·학습) 구조를 토대로 본인에게 잘 맞는 비즈니스 스타일과 투자 성향을 점검해보는 객관적인 지표로 활용하실 수 있습니다.'
        }
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqItems.map(item => ({
            '@type': 'Question',
            'name': item.q,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': item.a
            }
        }))
    };

    if (isAuthLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
                <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-800 animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-stone-800 font-sans antialiased">
            <PageSEO
                title="베라 정통 만세력 & 사주 풀이 - 음양오행과 내 운명의 흐름"
                description="정통 천문역법 만세력 8글자 시각화, 오행 균형 레이더 차트, 직업·재물 성향, 2인 궁합, 12시진 시간대별 운세까지 단아하고 품격 있는 무료 사주 서비스를 만나보세요."
                path="/entertainment/saju"
                jsonLd={jsonLd}
            />
            <Header user={user} onLogout={logout} />
            <EntertainmentSubMenu />

            <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full space-y-16">
                
                {/* 1. 단아한 한국형 히어로 소개 섹션 */}
                <section className="bg-white rounded-3xl border border-stone-200/80 p-8 sm:p-14 shadow-sm relative overflow-hidden">
                    <div className="max-w-2xl relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
                            정통 만세력 & 사주명리
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 leading-tight tracking-tight">
                            나를 온전히 마주하는 시간,<br />
                            <span className="text-stone-700">생년월일에 담긴 오행의 지혜</span>
                        </h1>

                        <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-normal">
                            사주팔자는 정해진 운명을 단정 짓는 것이 아니라, 내가 타고난 기질과 에너지의 지도를 읽는 지혜입니다. 
                            24절기 천문역법을 기반으로 사주 8글자의 조화와 나에게 필요한 오행(木·火·土·金·水)의 기운을 차분히 짚어드립니다.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-3.5">
                            <button
                                onClick={handleStartSaju}
                                className="px-8 py-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm sm:text-base font-semibold shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2.5 active:scale-[0.99]"
                            >
                                <span>만세력 및 사주 풀이 시작하기</span>
                                <i className="fas fa-arrow-right text-xs text-stone-400"></i>
                            </button>
                            
                            <button
                                onClick={handleShare}
                                className="px-5 py-4 rounded-xl bg-stone-100 hover:bg-stone-200/70 text-stone-700 text-sm font-medium transition-colors"
                            >
                                <i className="fas fa-share-nodes mr-1.5 text-stone-500"></i>
                                공유하기
                            </button>
                        </div>
                    </div>

                    {/* 배경 음양오행 심볼 장식 (은은하고 고급스러운 동양적 질감) */}
                    <div className="hidden md:flex absolute right-10 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-stone-200/60 items-center justify-center pointer-events-none opacity-40">
                        <div className="w-48 h-48 rounded-full border border-stone-200/80 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border border-dashed border-stone-300 flex items-center justify-center font-serif text-3xl text-stone-400">
                                陰陽
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. 네 가지 깊이 있는 풀이 영역 (정갈한 그리드) */}
                <section className="space-y-6">
                    <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                        <div>
                            <span className="text-xs font-semibold text-stone-500 tracking-wider uppercase">Analysis Pillars</span>
                            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">베라 사주가 전하는 네 가지 풀이</h2>
                        </div>
                        <p className="text-xs text-stone-500">객관적이고 실용적인 명리학 데이터를 통해 일상을 조망합니다.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* 1. 만세력과 오행 */}
                        <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-sm space-y-3.5 hover:border-stone-300 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">사주 원국</span>
                                <span className="text-xs text-stone-400 font-serif">四柱八字</span>
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">정통 만세력과 5대 오행 균형</h3>
                            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                                년·월·일·시의 8글자 천간지지와 십신, 지장간을 고유의 색상 카드로 단정하게 펼쳐 보여드립니다. 5각 오행 레이더 차트를 통해 나에게 넘치거나 부족한 기운(용신)을 한눈에 점검할 수 있습니다.
                            </p>
                        </div>

                        {/* 2. 직업과 자산 */}
                        <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-sm space-y-3.5 hover:border-stone-300 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md">진로 및 재물</span>
                                <span className="text-xs text-stone-400 font-serif">事業·財運</span>
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">비즈니스 기질과 투자 성향</h3>
                            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                                창의적이고 자율적인 사업가형 기질인지, 안정적인 리더십의 전문직형 기질인지 명리 지표로 짚어봅니다. 내 오행에 어울리는 산업 분야와 금융 포털(<Link to="/finance" className="text-stone-800 underline font-medium hover:text-stone-950">/finance</Link>) 연계 지표를 확인하실 수 있습니다.
                            </p>
                        </div>

                        {/* 3. 인연과 궁합 */}
                        <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-sm space-y-3.5 hover:border-stone-300 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md">인연과 화합</span>
                                <span className="text-xs text-stone-400 font-serif">宮合·相生</span>
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">2인 정밀 사주 궁합과 매력 신살</h3>
                            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                                상대방과의 사주 오행 상호 보완도(%)와 일간의 화합을 분석하여 정갈한 관계 조언을 드립니다. 내가 가진 도화살, 홍염살, 화개살 등 매력 신살의 긍정적 발현법도 함께 살펴봅니다.
                            </p>
                        </div>

                        {/* 4. 오늘의 흐름 */}
                        <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-sm space-y-3.5 hover:border-stone-300 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md">일상의 지혜</span>
                                <span className="text-xs text-stone-400 font-serif">時辰·運勢</span>
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">12시진 시간대별 흐름과 생활 조언</h3>
                            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                                하루를 12시진(자시~해시)으로 나누어 에너지가 최고조에 달하는 집중 시간대를 알려드립니다. 오늘의 행운 색상, 방향, 메뉴 추천과 마음을 다잡는 조언을 매일 새롭게 확인해 보세요.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. 명리학 이야기 & 기초 상식 (에디토리얼 탭) */}
                <section className="bg-white rounded-3xl border border-stone-200/80 p-8 sm:p-10 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-stone-900">명리학으로 읽는 삶의 원리</h2>
                            <p className="text-xs text-stone-500 mt-0.5">사주를 이해하는 데 유용한 기초 지식과 자주 묻는 질문들입니다.</p>
                        </div>

                        <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-1 self-start sm:self-auto">
                            <button
                                onClick={() => setActiveTab('pillars')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'pillars' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                            >
                                사주 4대 기둥
                            </button>
                            <button
                                onClick={() => setActiveTab('elements')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'elements' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                            >
                                오행의 특성
                            </button>
                            <button
                                onClick={() => setActiveTab('faq')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'faq' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                            >
                                자주 묻는 질문
                            </button>
                        </div>
                    </div>

                    {/* 탭 내용 1: 사주 4대 기둥 */}
                    {activeTab === 'pillars' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                                <span className="font-bold text-stone-800 text-sm block">년주 (年柱) · 근(根)</span>
                                <span className="text-stone-400 text-[11px] block">0세 ~ 19세 (초년운)</span>
                                <p className="text-stone-600 leading-relaxed pt-1">
                                    가문의 내력과 성장기의 토대를 의미하며, 타고난 기질의 뿌리를 상징합니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                                <span className="font-bold text-stone-800 text-sm block">월주 (月柱) · 묘(苗)</span>
                                <span className="text-stone-400 text-[11px] block">20세 ~ 39세 (청년운)</span>
                                <p className="text-stone-600 leading-relaxed pt-1">
                                    부모 형제와의 관계 및 사회적 활동, 직업적 재능과 커리어의 핵심을 나타냅니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1.5">
                                <span className="font-bold text-amber-900 text-sm block">일주 (日柱) · 화(花) ⭐</span>
                                <span className="text-amber-700/80 text-[11px] block">40세 ~ 59세 (중년운)</span>
                                <p className="text-amber-900 leading-relaxed pt-1">
                                    나 자신의 본질적인 자아와 배우자운을 뜻하며, 사주 해석의 가장 중요한 기준이 됩니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                                <span className="font-bold text-stone-800 text-sm block">시주 (時柱) · 실(實)</span>
                                <span className="text-stone-400 text-[11px] block">60세 이후 (말년운)</span>
                                <p className="text-stone-600 leading-relaxed pt-1">
                                    자녀와의 인연, 내면의 깊은 이상, 그리고 인생 후반부의 결실과 평온을 상징합니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 탭 내용 2: 오행의 특성 */}
                    {activeTab === 'elements' && (
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                            <div className="p-4 rounded-xl bg-[#F4F8F5] border border-emerald-200 space-y-1.5">
                                <span className="font-bold text-emerald-900 text-sm block">木 (목 · 푸른 나무)</span>
                                <p className="text-emerald-800 leading-relaxed">
                                    성장과 추진력, 인자함을 상징합니다. 시작하는 힘이 강하며 기획과 교육 분야에 어울립니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#FDF5F5] border border-rose-200 space-y-1.5">
                                <span className="font-bold text-rose-900 text-sm block">火 (화 · 붉은 불꽃)</span>
                                <p className="text-rose-800 leading-relaxed">
                                    열정과 확산, 예의와 표현력을 뜻합니다. 밝고 활달하며 IT, 미디어, 예술 분야에 유리합니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#FAF6EE] border border-amber-200 space-y-1.5">
                                <span className="font-bold text-amber-900 text-sm block">土 (토 · 기름진 흙)</span>
                                <p className="text-amber-800 leading-relaxed">
                                    신용과 포용력, 중심을 잡는 힘입니다. 다른 오행을 조율하며 부동산, 플랫폼, 중개에 능합니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#F6F8FA] border border-slate-300 space-y-1.5">
                                <span className="font-bold text-slate-800 text-sm block">金 (금 · 단단한 쇠)</span>
                                <p className="text-slate-700 leading-relaxed">
                                    결단력과 절제, 의리를 나타냅니다. 맺고 끊음이 분명하며 금융, 법률, 정밀 기술에 강합니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#F3F7FC] border border-sky-200 space-y-1.5">
                                <span className="font-bold text-sky-900 text-sm block">水 (수 · 깊은 물)</span>
                                <p className="text-sky-800 leading-relaxed">
                                    지혜와 유연함, 통찰력을 의미합니다. 환경에 맞추어 흐르며 유통, 데이터, 무역에 적합합니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 탭 내용 3: FAQ */}
                    {activeTab === 'faq' && (
                        <div className="space-y-3.5 text-xs">
                            {faqItems.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1">
                                    <strong className="text-stone-900 text-sm font-semibold block">Q. {item.q}</strong>
                                    <p className="text-stone-600 leading-relaxed pt-0.5">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 4. 하단 정갈한 배너 */}
                <section className="bg-stone-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                        나의 사주팔자와 오행 균형을 확인해보세요
                    </h2>
                    <p className="text-stone-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                        개인정보 저장 없이 무료로 이용하실 수 있습니다. 지금 바로 만세력 원국과 운세 리포트를 열어보세요.
                    </p>
                    <div className="pt-2">
                        <button
                            onClick={handleStartSaju}
                            className="px-8 py-3.5 bg-white text-stone-900 hover:bg-stone-100 font-semibold text-sm rounded-xl shadow-sm transition-all"
                        >
                            사주 분석 창 열기
                        </button>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
