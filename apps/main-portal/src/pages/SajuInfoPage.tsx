import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { useAppLauncher } from '../hooks/useAppLauncher';
import { PageSEO } from '../components/PageSEO';
import EntertainmentSubMenu from '../components/EntertainmentSubMenu';

export default function SajuInfoPage() {
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const { launchApp } = useAppLauncher();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'howtouse' | 'faq'>('howtouse');

    // ─── A. 로그아웃 상태 가드 적용 (요구사항 1번) ───
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
                title: 'VERA 무료 전통 사주 - 내 음양오행 분석',
                url: shareUrl,
            }).catch(err => console.error(err));
        } else {
            navigator.clipboard.writeText(shareUrl)
                .then(() => alert('사주 보기 링크가 클립보드에 복사되었습니다! 친구들에게 공유해 보세요.'))
                .catch(() => alert('링크 복사에 실패했습니다. 주소창의 URL을 직접 복사해 주세요.'));
        }
    };

    const faqItems = [
        {
            q: '사주 분석은 정말 무료인가요?',
            a: '네, VERA의 전통 사주 서비스는 로그인한 회원이라면 누구나 횟수 제한 없이 100% 무료로 이용하실 수 있습니다.'
        },
        {
            q: '태어난 시간을 몰라도 되나요?',
            a: '네, 입력 필드에서 "모름"을 고르시면 시주 분석을 제외한 연월일 기반의 음양오행으로 실감 나게 감정해 드립니다.'
        },
        {
            q: '개인정보는 안전한가요?',
            a: 'VERA 사주 감정기는 1회성 계산기로 동작합니다. 입력하신 이름과 생년월일은 DB에 전혀 저장되지 않고 파기되니 안심하셔도 됩니다.'
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

    // 로딩 중이거나 로그아웃되어 튕겨 나갈 때는 빈 화면 또는 로딩스피너 표출
    if (isAuthLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <PageSEO
                title="무료 전통 사주팔자 오행 분석기 - 내 운세 보기"
                description="VERA 무료 전통 사주 보기 서비스를 통해 내 생년월일시에 숨겨진 음양오행의 기운을 완벽 분석하고 재물운, 애정운, 건강운 등 다양한 운세 총평을 즉시 확인해 보세요."
                path="/entertainment/saju"
                jsonLd={jsonLd}
            />
            <Header user={user} onLogout={logout} />
            
            {/* 상단 서브메뉴 */}
            <EntertainmentSubMenu />
            
            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
                
                {/* 2컬럼 그리드 레이아웃 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* 좌측 (2컬럼 분량): H1 소개 카드 및 시작 버튼 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-10 shadow-sm relative overflow-hidden h-full flex flex-col justify-between min-h-[380px]">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500"></div>
                            
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-bold mb-4">
                                    <i className="fas fa-yin-yang"></i> 무료 명리학 운세 서비스
                                </span>
                                
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-snug mb-4">
                                    전통 사주팔자 오행 분석기 - 내 운세 무료 보기
                                </h1>
                                
                                <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-8">
                                    생년월일시에 담긴 우주의 음양오행 기운(木, 火, 土, 金, 水)을 입체적으로 계산하여, 당신의 기질과 균형 상태를 객관적으로 풀이해 드립니다. 1회성 분석으로 개인정보 저장 없이 안전합니다.
                                </p>
                            </div>

                            {/* 사주 시작 버튼 */}
                            <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
                                <button
                                    onClick={handleStartSaju}
                                    className="w-full sm:w-auto px-8 py-4 font-black rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                    aria-label="무료 사주 분석 시작하기"
                                >
                                    <i className="fas fa-yin-yang animate-spin-slow"></i>
                                    무료 사주 분석 시작하기
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 우측 (1컬럼 분량): 이용방법 및 FAQ 가이드 탭 */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
                            {/* 탭 헤더 */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2 flex-wrap gap-2">
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setActiveTab('howtouse')}
                                        className={`px-3 py-2 text-xs font-black rounded-lg transition-all ${
                                            activeTab === 'howtouse'
                                                ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        이용 방법
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('faq')}
                                        className={`px-3 py-2 text-xs font-black rounded-lg transition-all ${
                                            activeTab === 'faq'
                                                ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        FAQ
                                    </button>
                                </div>

                                <button
                                    onClick={handleShare}
                                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1"
                                    aria-label="사주 보기 링크 공유"
                                >
                                    <i className="fas fa-share-nodes text-slate-500"></i>
                                    공유
                                </button>
                            </div>

                            {/* 탭 바디 */}
                            <div className="p-6 flex-1 overflow-y-auto max-h-[350px] lg:max-h-none">
                                {activeTab === 'howtouse' ? (
                                    <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                                            <i className="fas fa-book-open text-violet-500"></i> 이용 가이드
                                        </h2>
                                        <ol className="space-y-3 list-decimal pl-4 leading-relaxed">
                                            <li>[무료 사주 분석 시작하기] 버튼을 클릭해 팝업 창을 엽니다.</li>
                                            <li>이름, 성별, 태어난 생년월일과 시간을 정확하게 입력합니다.</li>
                                            <li>[무료 사주 분석하기]를 누르면 음양오행 계산 로직이 작동합니다.</li>
                                            <li>다섯 가지 원소 분포율 그래프와 상세 운세 카드를 확인합니다.</li>
                                        </ol>
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                                            <i className="fas fa-question-circle text-violet-500"></i> 자주 묻는 질문
                                        </h2>
                                        <div className="space-y-3">
                                            {faqItems.map((item, idx) => (
                                                <div key={idx} className="border-b border-slate-100 last:border-0 pb-2.5 last:pb-0">
                                                    <h3 className="font-extrabold text-xs text-slate-800 mb-1">
                                                        Q. {item.q}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        {item.a}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
            </main>
            
            <Footer />
        </div>
    );
}
