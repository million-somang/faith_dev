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
    const [activeTab, setActiveTab] = useState<'features' | 'elements' | 'faq'>('features');

    // 로그인 가드
    useEffect(() => {
        if (!isAuthLoading && !user) {
            alert('사주 분석 서비스는 로그인 후 이용하실 수 있습니다. 로그인 페이지로 이동합니다.');
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
                title: 'VERA 사주 Pro - 차세대 모던 명리 데이터 & 2인 궁합',
                url: shareUrl,
            }).catch(err => console.error(err));
        } else {
            navigator.clipboard.writeText(shareUrl)
                .then(() => alert('사주 서비스 링크가 클립보드에 복사되었습니다!'))
                .catch(() => alert('주소창의 URL을 복사해 주세요.'));
        }
    };

    const faqItems = [
        {
            q: 'Veranex Saju Pro는 기존 사주와 무엇이 다른가요?',
            a: '고리타분한 한자투 풀이 대신, 현대 2040 세대의 라이프스타일에 맞춘 실용 명리 데이터를 제공합니다. 5대 오행 레이더 차트, 비즈니스/창업 기질 점수, 2인 정밀 궁합 티어표(S~D), 주식 투자 테마(/finance) 연동, 12시진(24시간) 에너지 바이오리듬과 로또/점심 룰렛까지 완벽 지원합니다.'
        },
        {
            q: '태어난 시간을 정확히 몰라도 분석이 가능한가요?',
            a: '네, 태어난 시간을 모르시는 경우 "시간 모름" 옵션을 선택하시면 연주(年柱), 월주(月柱), 일주(日柱)의 6글자 천간지지와 생년월일 해시 알고리즘을 결합하여 매우 높은 정확도로 오행 밸런스와 기질을 분석해 드립니다.'
        },
        {
            q: '2인 정밀 궁합은 어떤 원리로 계산되나요?',
            a: '단순한 띠 궁합이 아닌, 본인과 상대방의 사주팔자 오행(목화토금수) 상호 보완도(%), 일간(日干) 합·충 관계, 속궁합 및 갈등 지수를 종합 연산하여 S/A/B/C/D 5단계 티어와 맞춤 솔루션을 산출합니다.'
        },
        {
            q: '비즈니스 & 주식 투자 연계 기능은 무엇인가요?',
            a: '내 사주의 식상/재성/관성/인성 비율에 따라 사업가형 vs 전문직형을 진단하고, 가장 강한 오행 기운(예: 火)에 공명하는 첨단 성장 섹터(AI 반도체, 2차전지 등)를 큐레이션하여 Veranex 금융 주식 시세로 바로 이동할 수 있도록 연계합니다.'
        },
        {
            q: '개인정보는 안전하게 보호되나요?',
            a: '입력하신 이름과 생년월일시는 데이터베이스에 일절 저장되지 않는 1회성 프론트엔드 연산 구조로 작동하므로 개인정보 유출 걱정 없이 안심하고 이용하실 수 있습니다.'
        },
        {
            q: '출석 포인트 및 공유 기능은 어떻게 쓰나요?',
            a: '매일 사주를 확인하실 때마다 마이크로 운세와 행운 아이템(컬러/숫자/메뉴)이 갱신되며, 분석 결과 카드를 복사하여 인스타그램 스토리나 카카오톡으로 친구들과 손쉽게 공유할 수 있습니다.'
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <PageSEO
                title="Veranex Saju Pro - 차세대 만세력 & 2인 궁합 & 비즈니스 명리"
                description="정통 만세력 8글자, 5대 오행 레이더 차트, 비즈니스/창업운, 2인 정밀 궁합 티어표, 12시진 마이크로 운세, 주식 섹터 연동까지 제공하는 Veranex Saju Pro를 무료로 이용하세요."
                path="/entertainment/saju"
                jsonLd={jsonLd}
            />
            <Header user={user} onLogout={logout} />
            <EntertainmentSubMenu />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full space-y-12">
                {/* 1. 상단 히어로 섹션 */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl"></div>
                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-indigo-300 text-xs font-extrabold mb-5 border border-white/10 backdrop-blur-sm">
                            <span>🔮</span> Veranex Saju Pro Intelligence
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                            내 삶과 비즈니스를 바꾸는<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300">
                                모던 명리 데이터 플랫폼
                            </span>
                        </h1>

                        <p className="text-sm sm:text-base text-indigo-200 leading-relaxed mb-8">
                            정통 24절기 천문역법 8글자 시각화부터 5대 오행 레이더 차트, 사업/재물운, 2인 정밀 궁합 티어표, 그리고 오늘의 12시진 마이크로 바이오리듬까지 입체적으로 분석해 드립니다.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={handleStartSaju}
                                className="px-8 py-4 font-black rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-base sm:text-lg shadow-xl shadow-indigo-500/25 transition-all hover:-translate-y-0.5 flex items-center gap-2.5"
                            >
                                <span>✨</span> 내 사주 정밀 분석 시작하기 (무료)
                            </button>
                            <button
                                onClick={handleShare}
                                className="px-5 py-4 font-bold rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm border border-white/20 transition-colors flex items-center gap-2"
                            >
                                <span>📤</span> 서비스 공유
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Veranex Saju Pro 4대 킬러 기능 카드 그리드 */}
                <div className="space-y-6">
                    <div className="text-center max-w-2xl mx-auto">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">Feature Matrix</span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                            Veranex Saju Pro 핵심 분석 4대 축
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            고리타분한 옛날 사주는 끝! 당신의 일상과 비즈니스에 즉각 활용할 수 있는 현대적 명리 데이터를 제공합니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 카드 1: 종합 만세력 */}
                        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                                📊
                            </div>
                            <h3 className="text-xl font-black text-slate-900">1. 정통 만세력 & 5대 오행 레이더 차트</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                연주·월주·일주·시주 8글자의 천간·지지 색상 카드(목:초록, 화:빨강, 토:황색, 금:은백색, 수:남색)와 십신(十神), 지장간을 완벽 시각화합니다. 5각 오행 레이더 차트로 나의 과다/부족/용신(用神)을 진단하고 10년 대운 타임라인을 확인하세요.
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#8글자색상카드</span>
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#오행레이더</span>
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#10년대운타임라인</span>
                            </div>
                        </div>

                        {/* 카드 2: 비즈니스 & 재물운 */}
                        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
                                💼
                            </div>
                            <h3 className="text-xl font-black text-slate-900">2. 비즈니스 · 재물운 & 주식 투자 연계</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                내 사주가 '사업가형(식상생재/편재격)'인지 '전문직/관리자형(관인상생)'인지 점수로 산출합니다. 내 오행(火/木 등)에 공명하는 추천 주식 섹터(반도체, 2차전지 등)를 제시하며, Veranex 금융(<Link to="/finance" className="text-indigo-600 underline font-bold">/finance</Link>) 주식 페이지로 즉시 이동할 수 있습니다.
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#창업성공운</span>
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#투자성향진단</span>
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#계약길일TOP3</span>
                            </div>
                        </div>

                        {/* 카드 3: 연애 & 2인 궁합 */}
                        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl">
                                ❤️
                            </div>
                            <h3 className="text-xl font-black text-slate-900">3. 2인 정밀 사주 궁합 & 3대 신살 매력도</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                연인, 썸, 비즈니스 파트너의 생년월일시를 입력하면 서로의 결핍을 채워주는 오행 상호 보완율(%)과 일간 합충 케미를 연산하여 <strong>S / A / B / C / D 궁합 티어표</strong>를 생성합니다. 도화살, 홍염살, 화개살 매력 지수와 솔로 인연 타이밍도 함께 확인하세요.
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#커플궁합티어</span>
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#도화홍염화개살</span>
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#속궁합갈등지수</span>
                            </div>
                        </div>

                        {/* 카드 4: 마이크로 운세 */}
                        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
                                ⚡
                            </div>
                            <h3 className="text-xl font-black text-slate-900">4. 초밀착 12시진 마이크로 운세 & 일상 도구</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                하루 24시간을 12간지 시진으로 나눈 시간대별 에너지 바이오리듬 그래프를 제공하여 가장 중요한 결정을 내리기 좋은 골든 타임을 알려줍니다. <strong>6종 행운 아이템(컬러 HEX, 숫자, 방위, 메뉴, 주의사항)</strong>과 점심 룰렛, 오행 로또 6/45 번호 추첨기를 매일 이용하세요.
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#12시진바이오리듬</span>
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#행운컬러숫자</span>
                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">#오행로또번호추첨</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. 명리학 오행 원리 & 용어 가이드 탭 섹션 */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <span>📚</span> Veranex 명리학 & 사주 용어 사전
                            </h3>
                            <p className="text-xs text-slate-500">사주팔자를 올바르게 이해하고 삶에 적용하는 핵심 가이드</p>
                        </div>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('features')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'features' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                4대 기둥(四柱)
                            </button>
                            <button
                                onClick={() => setActiveTab('elements')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'elements' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                음양오행(五行)
                            </button>
                            <button
                                onClick={() => setActiveTab('faq')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'faq' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                FAQ
                            </button>
                        </div>
                    </div>

                    {activeTab === 'features' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <span className="font-extrabold text-indigo-600 text-sm block">연주 (年柱 - 뿌리)</span>
                                <p className="text-slate-600 leading-relaxed">
                                    조상운, 가문의 기운, 0~19세 초년기의 성장 환경과 타고난 기질의 바탕을 상징합니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <span className="font-extrabold text-indigo-600 text-sm block">월주 (月柱 - 기둥)</span>
                                <p className="text-slate-600 leading-relaxed">
                                    부모운, 사회적 환경, 직업과 커리어의 핵심 방향성 및 20~39세 청년기 사회운을 나타냅니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                                <span className="font-extrabold text-indigo-700 text-sm block">일주 (日柱 - 나 자신 ⭐)</span>
                                <p className="text-indigo-900 leading-relaxed">
                                    나 자신의 본질적 자아와 배우자운을 뜻하며, 40~59세 중년기 삶의 전성기와 핵심 가치관을 결정짓습니다.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <span className="font-extrabold text-indigo-600 text-sm block">시주 (時柱 - 열매)</span>
                                <p className="text-slate-600 leading-relaxed">
                                    자녀운, 숨겨진 내면의 욕망, 노후의 삶과 인생 후반부 60세 이후 완성기 운세를 나타냅니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'elements' && (
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                                <strong className="text-emerald-700 text-sm block">木 (목: 나무)</strong>
                                <p className="text-emerald-900 leading-relaxed">추진력, 성장, 새로운 시작, 인자함. 교육·기획·바이오 분야에 유리.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-1.5">
                                <strong className="text-red-700 text-sm block">火 (화: 불)</strong>
                                <p className="text-red-900 leading-relaxed">열정, 표현력, 확산, 카리스마. AI·반도체·엔터·마케팅에 유리.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                                <strong className="text-amber-700 text-sm block">土 (토: 흙)</strong>
                                <p className="text-amber-900 leading-relaxed">신용, 안정, 조율, 포용력. 부동산·인프라·플랫폼·금융에 유리.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-1.5">
                                <strong className="text-slate-700 text-sm block">金 (금: 쇠)</strong>
                                <p className="text-slate-800 leading-relaxed">결단력, 의리, 규칙, 정교함. 금융·법률·기계·의료 분야에 유리.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5">
                                <strong className="text-blue-700 text-sm block">水 (수: 물)</strong>
                                <p className="text-blue-900 leading-relaxed">지혜, 유연성, 소통, 통찰력. 무역·유통·빅데이터·해운에 유리.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'faq' && (
                        <div className="space-y-3 text-xs">
                            {faqItems.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <strong className="text-slate-900 font-extrabold text-sm block">Q. {item.q}</strong>
                                    <p className="text-slate-600 leading-relaxed">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. 하단 CTA 배너 */}
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-3xl p-8 text-center space-y-4 shadow-xl">
                    <h3 className="text-2xl sm:text-3xl font-black">
                        지금 바로 나만의 모던 사주 리포트를 확인해 보세요!
                    </h3>
                    <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto">
                        1회성 무료 연산으로 개인정보 저장 없이 1초 만에 오행 차트와 맞춤 비즈니스/궁합 결과를 확인하실 수 있습니다.
                    </p>
                    <div>
                        <button
                            onClick={handleStartSaju}
                            className="px-8 py-4 bg-white text-indigo-700 hover:bg-indigo-50 font-black text-base rounded-2xl shadow-lg transition-all transform active:scale-98"
                        >
                            🔮 무료 사주 분석 팝업 열기
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
